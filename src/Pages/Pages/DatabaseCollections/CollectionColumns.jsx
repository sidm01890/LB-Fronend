import React, { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import BlankCard from "../../../components/BlankCard";
import useCollectionColumns from "./useCollectionColumns";
import PrimaryButton from "../../../components/PrimaryButton";

export default function CollectionColumns() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const collectionName = searchParams.get("collection");

  const {
    allColumns,
    selectedColumns,
    collectionInfo,
    toggleColumnSelection,
    updateCollectionFields,
  } = useCollectionColumns(collectionName);

  const handleBack = () => {
    navigate("/database-collection");
  };

  // Filter out selected columns from all columns
  const unselectedColumns = allColumns.filter(
    (column) => !selectedColumns.includes(column)
  );

  const handleColumnClick = (column) => {
    toggleColumnSelection(column);
  };

  return (
    <div className="">
      <BlankCard
        header={
          <div className="flex-1 flex">
            <button onClick={handleBack}>
              <span className="material-icons-outlined mr-2">
                {"arrow_back"}
              </span>
            </button>
            <h4 className="box-title font-bold text-base">
              COLLECTION COLUMNS - {collectionName?.toUpperCase() || ""}
            </h4>
          </div>
        }
      >
        <div className="pt-3 w-full">
          <div className="flex justify-end mb-4">
            <div>
              {selectedColumns.length === 0 && (
                <div className="mb-2 text-sm text-amber-600 font-medium">
                  ⚠️ At least one column must be selected
                </div>
              )}
              <PrimaryButton
                label="Update Selected Fields"
                onClick={updateCollectionFields}
                disabled={selectedColumns.length === 0}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {/* First Part - All Columns */}
            <div className="flex-1">
              <BlankCard
                header={
                  <h4 className="box-title font-bold text-base">
                    ALL COLUMNS ({unselectedColumns.length})
                  </h4>
                }
              >
                <div
                  className="mt-2 mb-2 p-2"
                  style={{
                    maxHeight: "60vh",
                    overflowY: "auto",
                    backgroundColor: "#ffffff",
                  }}
                >
                  {unselectedColumns.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No unselected columns found
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {unselectedColumns.map((column, index) => (
                        <button
                          key={index}
                          onClick={() => handleColumnClick(column)}
                          className="px-4 py-2 rounded-md text-sm font-medium transition-all bg-gray-100 border-2 border-gray-300 text-gray-700 hover:bg-gray-200 cursor-pointer"
                        >
                          <span>{column}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </BlankCard>
            </div>

            {/* Second Part - Selected Columns */}
            <div className="flex-1">
              <BlankCard
                header={
                  <h4 className="box-title font-bold text-base">
                    SELECTED COLUMNS ({selectedColumns.length})
                  </h4>
                }
              >
                <div
                  className="mt-2 mb-2 p-2"
                  style={{
                    maxHeight: "60vh",
                    overflowY: "auto",
                    backgroundColor: "#ffffff",
                  }}
                >
                  {selectedColumns.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No selected columns
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {selectedColumns.map((column, index) => (
                        <button
                          key={index}
                          onClick={() => handleColumnClick(column)}
                          className="px-4 py-2 rounded-md text-sm font-medium bg-green-100 border-2 border-green-500 text-green-800 hover:bg-green-200 cursor-pointer"
                        >
                          <div className="flex items-center">
                            <span>{column}</span>
                            <span className="ml-2 text-green-600">
                              <i className="fa-solid fa-check"></i>
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </BlankCard>
            </div>
          </div>
        </div>
      </BlankCard>
    </div>
  );
}
