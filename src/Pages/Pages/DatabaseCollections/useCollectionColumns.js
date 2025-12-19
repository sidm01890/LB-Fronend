import { useState, useEffect } from "react";
import { apiEndpoints } from "../../../ServiceRequest/APIEndPoints";
import {
  requestCallGet,
  requestCallPost,
} from "../../../ServiceRequest/APIFunctions";
import { useLoader } from "../../../Utils/Loader";

const useCollectionColumns = (collectionName) => {
  const { setLoading, setToastMessage } = useLoader();
  const [allColumns, setAllColumns] = useState([]);
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [collectionInfo, setCollectionInfo] = useState(null);

  const fetchCollectionKeys = async () => {
    if (!collectionName) return;

    setLoading(true);
    try {
      const response = await requestCallPost(apiEndpoints.GET_COLLECTION_KEYS, {
        collection_name: collectionName,
      });
      if (response.status) {
        const keys = response?.data?.data?.keys || [];
        setAllColumns(keys);
        setCollectionInfo(response?.data?.data);
      } else {
        setAllColumns([]);
        setToastMessage({
          message: response.message || "Failed to fetch collection keys",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Error fetching collection keys:", error);
      setAllColumns([]);
      setToastMessage({
        message: "Error loading collection keys",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCollectionFields = async () => {
    if (!collectionName) return;

    setLoading(true);
    try {
      const response = await requestCallGet(
        `${apiEndpoints.GET_COLLECTION_FIELDS}/${collectionName}`
      );
      if (response.status) {
        const fields = response?.data?.data?.selected_fields || [];
        setSelectedColumns(fields);
      } else {
        setSelectedColumns([]);
        // Don't show error if no fields are selected yet (might be new collection)
        if (
          response?.data?.message &&
          !response?.data?.message.includes("not found")
        ) {
          setToastMessage({
            message: response.message || "Failed to fetch selected fields",
            type: "error",
          });
        }
      }
    } catch (error) {
      console.error("Error fetching collection fields:", error);
      setSelectedColumns([]);
      // Don't show error if fields endpoint fails (might be new collection)
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (collectionName) {
      fetchCollectionKeys();
      fetchCollectionFields();
    }
  }, [collectionName]);

  const toggleColumnSelection = (column) => {
    if (selectedColumns.includes(column)) {
      // Remove from selected
      setSelectedColumns((prev) => prev.filter((col) => col !== column));
    } else {
      // Add to selected
      setSelectedColumns((prev) => [...prev, column]);
    }
  };

  const updateCollectionFields = async () => {
    if (!collectionName) {
      setToastMessage({
        message: "Collection name is required",
        type: "error",
      });
      return;
    }

    // Client-side validation: Check if at least one column is selected
    if (selectedColumns.length === 0) {
      setToastMessage({
        message: "At least one column must be selected. Please select at least one column before updating.",
        type: "error",
      });
      return;
    }

    setLoading(true);
    try {
      const requestBody = {
        collection_name: collectionName,
        selected_fields: selectedColumns,
      };

      const response = await requestCallPost(
        apiEndpoints.UPDATE_COLLECTION_FIELDS,
        requestBody
      );

      if (response.status) {
        setToastMessage({
          message: response?.data?.message || "Fields updated successfully",
          type: "success",
        });
        // Optionally refresh the fields to get updated data
        fetchCollectionFields();
      } else {
        // Extract error message from response.data or response.message
        const errorMsg = response?.data?.details?.[0]?.msg 
                      || response?.data?.detail 
                      || response?.message 
                      || "Failed to update fields";
        
        setToastMessage({
          message: errorMsg,
          type: "error",
        });
      }
    } catch (error) {
      console.error("Error updating collection fields:", error);
      
      // Extract error message from catch block
      const errorMsg = error?.response?.data?.details?.[0]?.msg 
                    || error?.response?.data?.detail 
                    || error?.message 
                    || "Error updating fields";
      
      setToastMessage({
        message: errorMsg,
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    allColumns,
    selectedColumns,
    collectionInfo,
    fetchCollectionKeys,
    fetchCollectionFields,
    toggleColumnSelection,
    setSelectedColumns,
    updateCollectionFields,
  };
};

export default useCollectionColumns;
