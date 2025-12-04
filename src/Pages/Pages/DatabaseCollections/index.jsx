import React, { useEffect } from "react";
import ReactDOM from "react-dom";
import { useNavigate } from "react-router-dom";
import BlankCard from "../../../components/BlankCard";
import useDatabaseCollection from "./useDatabaseCollection";
import PrimaryButton from "../../../components/PrimaryButton";
import SecondaryButton from "../../../components/SecondaryButton";
import CustomInput from "../../../components/CustomInput";
import OutlineButton from "../../../components/OutlineButton";

export default function DatabaseCollections() {
  const navigate = useNavigate();
  const {
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
  } = useDatabaseCollection();

  useEffect(() => {
    fetchDatabaseCollections();
  }, []);

  const handleViewColumns = (collectionName) => {
    navigate(`/database-collection/columns?collection=${collectionName}`);
  };

  // Function to render table cell value
  const renderCellValue = (value) => {
    if (value === null || value === undefined) {
      return <span className="text-gray-400">-</span>;
    }
    if (typeof value === "object") {
      return <span className="text-gray-600">{JSON.stringify(value)}</span>;
    }
    return <span>{String(value)}</span>;
  };

  return (
    <div className="">
      <BlankCard
        header={
          <h4 className="box-title font-bold text-base">
            DATABASE COLLECTIONS
          </h4>
        }
      >
        <div className="pt-3 w-full">
          <div className="flex">
            <div className="flex-1 flex justify-start items-center">
              <p className="text-black-600">LIST OF DATABASE COLLECTIONS</p>
            </div>
            <div className="flex-1 flex justify-end items-center">
              <div>
                <PrimaryButton label="Add Collection" onClick={openModal} />
              </div>
            </div>
          </div>
          <div
            className="relative overflow-x-auto mt-2 mb-2 custom-table-style"
            style={{ maxHeight: "70vh", overflowY: "auto" }}
          >
            {collections.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No database collections found
              </div>
            ) : (
              <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400 sticky top-0">
                  <tr>
                    <th scope="col">Collection Name</th>
                    <th
                      scope="col flex"
                      style={{
                        width: "360px",
                        textAlign: "center",
                      }}
                    >
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {collections.map((collection, index) => (
                    <tr
                      key={index}
                      className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                    >
                      <td className="px-6 py-1">{collection}</td>
                      <td className="px-6 py-1 flex justify-center items-center gap-2">
                        <OutlineButton
                          label="Manage Unique IDs"
                          onClick={() => openEditModal(collection)}
                        />
                        <OutlineButton
                          label="Manage Columns"
                          onClick={() => handleViewColumns(collection)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </BlankCard>

      {/* Add Collection Modal */}
      {isModalOpen &&
        ReactDOM.createPortal(
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
            <div className="bg-white rounded-lg p-6 w-96 max-w-full">
              <div className="flex justify-between items-center mb-4 border-b pb-4">
                <h2 className="text-2xl font-bold">Add Collection</h2>
                <button
                  onClick={closeModal}
                  className="text-gray-700 hover:text-gray-900 text-2xl font-bold"
                >
                  ×
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  createCollection();
                }}
              >
                <CustomInput
                  label="Collection Name"
                  name="collection_name"
                  placeholder="Enter collection name"
                  value={formData.collection_name}
                  onChange={(e) =>
                    handleInputChange("collection_name", e.target.value)
                  }
                  error={formErrors.collection_name}
                  required
                />

                <CustomInput
                  label="Primary Keys (comma separated)"
                  name="primary_keys"
                  placeholder="e.g., order_id, order_date"
                  value={formData.primary_keys}
                  onChange={(e) =>
                    handleInputChange("primary_keys", e.target.value)
                  }
                  error={formErrors.primary_keys}
                />

                <div className="flex justify-end gap-3 mt-6">
                  <SecondaryButton
                    label="Close"
                    onClick={(e) => {
                      e.preventDefault();
                      closeModal();
                    }}
                  />
                  <PrimaryButton label="Save" onClick={createCollection} />
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* Edit Unique IDs Modal */}
      {isEditModalOpen &&
        ReactDOM.createPortal(
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
            <div className="bg-white rounded-lg p-6 w-96 max-w-full">
              <div className="flex justify-between items-center mb-4 border-b pb-4">
                <h2 className="text-2xl font-bold">Manage Unique IDs</h2>
                <button
                  onClick={closeEditModal}
                  className="text-gray-700 hover:text-gray-900 text-2xl font-bold"
                >
                  ×
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  updateCollectionUniqueIds();
                }}
              >
                <CustomInput
                  label="Collection Name"
                  name="collection_name"
                  placeholder="Enter collection name"
                  value={editFormData.collection_name}
                  onChange={(e) =>
                    handleEditInputChange("collection_name", e.target.value)
                  }
                  error={editFormErrors.collection_name}
                  required
                  disabled={true}
                />

                <CustomInput
                  label="Unique IDs (comma separated)"
                  name="primary_keys"
                  placeholder="e.g., order_id, order_date"
                  value={editFormData.primary_keys}
                  onChange={(e) =>
                    handleEditInputChange("primary_keys", e.target.value)
                  }
                  error={editFormErrors.primary_keys}
                />

                <div className="flex justify-end gap-3 mt-6">
                  <SecondaryButton
                    label="Close"
                    onClick={(e) => {
                      e.preventDefault();
                      closeEditModal();
                    }}
                  />
                  <PrimaryButton
                    label="Update"
                    onClick={updateCollectionUniqueIds}
                  />
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
