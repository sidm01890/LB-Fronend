import { useState, useEffect } from "react";
import { apiEndpoints } from "../../../ServiceRequest/APIEndPoints";
import {
  requestCallGet,
  requestCallPost,
  requestCallPut,
} from "../../../ServiceRequest/APIFunctions";
import { useLoader } from "../../../Utils/Loader";

const useDatabaseCollection = () => {
  const { setLoading, setToastMessage } = useLoader();
  const [collections, setCollections] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    collection_name: "",
    primary_keys: "",
  });
  const [editFormData, setEditFormData] = useState({
    collection_name: "",
    primary_keys: "",
  });
  const [formErrors, setFormErrors] = useState({});
  const [editFormErrors, setEditFormErrors] = useState({});

  const fetchDatabaseCollections = async () => {
    setLoading(true);
    try {
      const response = await requestCallGet(
        apiEndpoints.GET_DATABASE_COLLECTIONS
      );
      if (response.status) {
        // Handle different possible response structures
        const data = response?.data?.data?.collections || [];
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
    } finally {
      setLoading(false);
    }
  };

  const openModal = () => {
    setIsModalOpen(true);
    setFormData({
      collection_name: "",
      primary_keys: "",
    });
    setFormErrors({});
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({
      collection_name: "",
      primary_keys: "",
    });
    setFormErrors({});
  };

  const handleInputChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field when user starts typing
    if (formErrors[name]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.collection_name || formData.collection_name.trim() === "") {
      errors.collection_name = "Collection name is required";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const createCollection = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      // Parse primary keys from comma-separated string
      let unique_ids = [];
      if (formData.primary_keys && formData.primary_keys.trim() !== "") {
        unique_ids = formData.primary_keys
          .split(",")
          .map((key) => key.trim())
          .filter((key) => key !== "");
      }

      const requestBody = {
        collection_name: formData.collection_name.trim(),
        ...(unique_ids.length > 0 && { unique_ids }),
      };

      const response = await requestCallPost(
        apiEndpoints.CREATE_DATABASE_COLLECTION,
        requestBody
      );

      if (response.status) {
        setToastMessage({
          message: "Collection created successfully",
          type: "success",
        });
        closeModal();
        // Refresh the collections list
        fetchDatabaseCollections();
      } else {
        setToastMessage({
          message: response.message || "Failed to create collection",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Error creating collection:", error);
      setToastMessage({
        message: "Error creating collection",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCollectionUniqueIds = async (collectionName) => {
    try {
      // Use GET endpoint to fetch unique_ids for the collection
      const response = await requestCallGet(
        `${apiEndpoints.GET_COLLECTION_UNIQUE_IDS}/${collectionName}`
      );

      if (response.status) {
        // Extract unique_ids from the response structure
        const data = response?.data?.data || {};
        const unique_ids = data?.unique_ids || [];

        // Ensure it's an array
        return Array.isArray(unique_ids) ? unique_ids : [];
      }

      return [];
    } catch (error) {
      console.error("Error fetching unique_ids:", error);
      console.error("Error details:", error.response || error.message);
      return [];
    }
  };

  const openEditModal = async (collectionName) => {
    setEditFormErrors({});

    // Fetch existing unique_ids first
    setLoading(true);
    const unique_ids = await fetchCollectionUniqueIds(collectionName);
    setLoading(false);

    console.log("Fetched unique_ids:", unique_ids);

    // Now open modal with pre-filled data
    setIsEditModalOpen(true);
    setEditFormData({
      collection_name: collectionName,
      primary_keys:
        unique_ids && unique_ids.length > 0 ? unique_ids.join(", ") : "",
    });
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditFormData({
      collection_name: "",
      primary_keys: "",
    });
    setEditFormErrors({});
  };

  const handleEditInputChange = (name, value) => {
    setEditFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field when user starts typing
    if (editFormErrors[name]) {
      setEditFormErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateEditForm = () => {
    const errors = {};

    if (
      !editFormData.collection_name ||
      editFormData.collection_name.trim() === ""
    ) {
      errors.collection_name = "Collection name is required";
    }

    setEditFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const updateCollectionUniqueIds = async () => {
    if (!validateEditForm()) {
      return;
    }

    setLoading(true);
    try {
      // Parse primary keys from comma-separated string
      let unique_ids = [];
      if (
        editFormData.primary_keys &&
        editFormData.primary_keys.trim() !== ""
      ) {
        unique_ids = editFormData.primary_keys
          .split(",")
          .map((key) => key.trim())
          .filter((key) => key !== "");
      }

      const requestBody = {
        collection_name: editFormData.collection_name.trim(),
        unique_ids: unique_ids,
      };

      const response = await requestCallPut(
        apiEndpoints.CREATE_DATABASE_COLLECTION,
        requestBody
      );

      if (response.status) {
        setToastMessage({
          message: "Unique IDs updated successfully",
          type: "success",
        });
        closeEditModal();
        // Refresh the collections list
        fetchDatabaseCollections();
      } else {
        setToastMessage({
          message: response.message || "Failed to update unique IDs",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Error updating unique IDs:", error);
      setToastMessage({
        message: "Error updating unique IDs",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatabaseCollections();
  }, []);

  return {
    collections,
    fetchDatabaseCollections,
    isModalOpen,
    openModal,
    closeModal,
    formData,
    handleInputChange,
    createCollection,
    formErrors,
    isEditModalOpen,
    openEditModal,
    closeEditModal,
    editFormData,
    handleEditInputChange,
    updateCollectionUniqueIds,
    editFormErrors,
  };
};

export default useDatabaseCollection;
