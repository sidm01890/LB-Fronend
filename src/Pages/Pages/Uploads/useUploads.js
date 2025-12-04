import { useEffect, useState } from "react";
import { apiEndpoints } from "../../../ServiceRequest/APIEndPoints";
import {
  requestCallGet,
  requestCallPost,
} from "../../../ServiceRequest/APIFunctions";
import { useLoader } from "../../../Utils/Loader";
import LOG_ACTIONS from "../../../Constants/LogAction";
import useMakeLogs from "../../../Hooks/useMakeLogs";

const BLANK_FILTERS = {
  collection: "",
};

const useUploads = () => {
  const { setToastMessage, setLoading } = useLoader();
  const { makeLog } = useMakeLogs();
  const [collections, setCollections] = useState([]);
  const [values, setValues] = useState(BLANK_FILTERS);
  const [files, setFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileChange = (e) => {
    setFiles(e);
  };

  const handleChange = (name, value) => {
    setValues({ ...values, [name]: value });
  };

  useEffect(() => {
    fetchDatabaseCollections();
  }, []);

  const fetchDatabaseCollections = async () => {
    try {
      const response = await requestCallGet(
        apiEndpoints.GET_DATABASE_COLLECTIONS
      );
      if (response.status) {
        // Handle different possible response structures
        const data =
          response?.data?.data?.collections || response?.data?.data || [];
        setCollections(Array.isArray(data) ? data : []);
      } else {
        setCollections([]);
        setToastMessage({
          message: "Failed to fetch database collections",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Error fetching database collections:", error);
      setCollections([]);
      setToastMessage({
        message: "Error loading database collections",
        type: "error",
      });
    }
  };

  const uploadFileInChunks = async (file, datasource) => {
    const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    const uploadId = `${Date.now()}_${file.name.replace(
      /[^a-zA-Z0-9.-]/g,
      "_"
    )}`;

    console.log(
      `Starting chunked upload: ${file.name} (${totalChunks} chunks, ${(
        file.size /
        1024 /
        1024
      ).toFixed(2)}MB)`
    );

    // Upload each chunk
    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      const start = chunkIndex * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, file.size);
      const chunk = file.slice(start, end);

      const chunkFormData = new FormData();
      chunkFormData.append("chunk", chunk, file.name);
      chunkFormData.append("chunk_index", chunkIndex.toString());
      chunkFormData.append("total_chunks", totalChunks.toString());
      chunkFormData.append("upload_id", uploadId);
      chunkFormData.append("file_name", file.name);

      const customConfig = {
        langId: 1,
        Accept: "application/json",
        "Content-Type": "multipart/form-data",
      };

      // Retry logic for each chunk
      let retries = 3;
      let success = false;

      while (retries > 0 && !success) {
        try {
          const response = await requestCallPost(
            `${apiEndpoints.UPLOAD_CHUNK}?datasource=${datasource}`,
            chunkFormData,
            customConfig,
            { timeout: 300000 } // 5 minutes per chunk
          );

          if (response.status) {
            success = true;
            const progress = ((chunkIndex + 1) / totalChunks) * 100;
            setUploadProgress(progress);
            console.log(
              `Chunk ${
                chunkIndex + 1
              }/${totalChunks} uploaded (${progress.toFixed(1)}%)`
            );
          } else {
            throw new Error(response.message || "Chunk upload failed");
          }
        } catch (error) {
          retries--;
          if (retries === 0) {
            throw new Error(
              `Failed to upload chunk ${chunkIndex + 1} after 3 retries: ${
                error?.message || error
              }`
            );
          }
          // Wait before retry (exponential backoff)
          await new Promise((resolve) =>
            setTimeout(resolve, 1000 * (4 - retries))
          );
          console.warn(
            `Retrying chunk ${chunkIndex + 1}... (${retries} retries left)`
          );
        }
      }
    }

    // Finalize upload
    console.log(`Finalizing upload: ${uploadId}`);
    const finalizeResponse = await requestCallPost(
      `${
        apiEndpoints.UPLOAD_FINALIZE
      }?datasource=${datasource}&upload_id=${uploadId}&file_name=${encodeURIComponent(
        file.name
      )}`,
      {},
      { langId: 1 },
      { timeout: 60000 }
    );

    if (!finalizeResponse.status) {
      throw new Error(finalizeResponse.message || "Failed to finalize upload");
    }

    return finalizeResponse;
  };

  const onSubmit = async () => {
    try {
      if (!values?.collection || values?.collection === "") {
        setToastMessage({
          message: "Please select a collection.",
          type: "error",
        });
        return;
      }

      if (files?.length === 0) {
        setToastMessage({
          message: "Please select file.",
          type: "error",
        });
        return;
      }

      setLoading(true);
      setUploadProgress(0);

      // Ensure files is an array (handle FileList, single file, or array)
      const filesArray = Array.isArray(files)
        ? files
        : files?.length
        ? Array.from(files)
        : [files].filter(Boolean);

      if (filesArray.length === 0) {
        setToastMessage({
          message: "Please select file.",
          type: "error",
        });
        setLoading(false);
        return;
      }

      // Use collection as datasource
      const datasource = values?.collection;

      // Check if any file is large (>50MB) - use chunked upload
      const LARGE_FILE_THRESHOLD = 50 * 1024 * 1024; // 50MB
      const hasLargeFile = filesArray.some(
        (file) => file && file.size > LARGE_FILE_THRESHOLD
      );

      if (hasLargeFile) {
        // Use chunked upload for large files
        console.log(`Large file(s) detected, using chunked upload`);

        for (let i = 0; i < filesArray.length; i++) {
          const file = filesArray[i];
          if (!file) continue;
          console.log(
            `Uploading file ${i + 1}/${filesArray.length}: ${file.name} (${(
              file.size /
              1024 /
              1024
            ).toFixed(2)}MB)`
          );

          try {
            await uploadFileInChunks(file, datasource);
          } catch (error) {
            throw new Error(`Failed to upload ${file.name}: ${error.message}`);
          }
        }

        setUploadProgress(100);
      } else {
        // Use regular upload for small files
        const formData = new FormData();
        for (let i = 0; i < filesArray.length; i++) {
          if (filesArray[i]) {
            formData.append("files", filesArray[i]);
          }
        }

        const customConfig = {
          langId: 1,
          Accept: "application/json",
          "Content-Type": "multipart/form-data",
        };

        const response = await requestCallPost(
          `${apiEndpoints.UPLOAD_FILE}?datasource=${datasource}`,
          formData,
          customConfig,
          { timeout: 600000 } // 10 minutes for regular upload
        );

        if (!response.status) {
          throw new Error(response.message || "Upload failed");
        }

        setUploadProgress(100);
      }

      // Success
      makeLog(
        LOG_ACTIONS.UPLOAD,
        `Uploaded - ${datasource}`,
        `${apiEndpoints.UPLOAD_FILE}?datasource=${datasource}`,
        values
      );
      setValues(BLANK_FILTERS);
      setFiles([]);
      setUploadProgress(0);
      setToastMessage({
        message: "File uploaded successfully.",
        type: "success",
      });
    } catch (error) {
      console.error(error);
      setUploadProgress(0);
      setToastMessage({
        message:
          error?.message ||
          error?.response?.data?.detail ||
          "Upload failed. Please try again.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    fetchDatabaseCollections,
    collections,
    handleChange,
    values,
    handleFileChange,
    onSubmit,
    files,
    uploadProgress,
  };
};

export default useUploads;
