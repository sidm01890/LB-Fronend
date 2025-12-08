import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { setLogicGroups, setLogicData } from "../../../Redux/Slices/Logics";
import "../../Styles/DefineLogic.css";
import BlankCard from "../../../components/BlankCard";
import useLogic from "./useLogic";
import moment from "moment";
import ExpandableCard from "./ExpandableCard";
import SetLogics from "./SetLogics";
import PrimaryButton from "../../../components/PrimaryButton";
import DropdownWithCheckbox from "../../../components/DropDownWithCheckbox";
import CustomSelect from "../../../components/CustomSelect";
import CustomInput from "../../../components/CustomInput";
import { apiEndpoints } from "../../../ServiceRequest/APIEndPoints";
import {
  requestCallGet,
  requestCallPost,
  requestCallPut,
} from "../../../ServiceRequest/APIFunctions";
import { useLoader } from "../../../Utils/Loader";

const ManageFormulas = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const reportName = searchParams.get("report");
  const { fetchReportFormulas } = useLogic();
  const { setLoading, setToastMessage } = useLoader();
  const { logicGroups, logicData: reduxLogicData } = useSelector(
    (state) => state.LogicsService
  );
  const [reportData, setReportData] = useState(null);
  const [formulas, setFormulas] = useState([]);
  const [logicGroup, setLogicGroup] = useState(null);
  const [dataSetOptions, setDataSetOptions] = useState([]);

  // Mapping keys management state (report level)
  const [selectedCollections, setSelectedCollections] = useState([]);
  const [collectionColumns, setCollectionColumns] = useState({}); // { collectionName: [columns] }
  const [collectionMappingKeys, setCollectionMappingKeys] = useState({}); // { collectionName: [mappingKeys] }
  const [collectionConditions, setCollectionConditions] = useState({}); // { collectionName: [{ column, operator, value, id }] }

  // Derive allCollections from dataSetOptions
  const allCollections = dataSetOptions.map((option) => ({
    value: option.dataset_name,
    label: option.dataset_name,
  }));

  useEffect(() => {
    if (reportName) {
      fetchFormulasData();
      fetchCollectionsAndColumns();
    }
  }, [reportName]);

  // Fetch columns for mapping keys when dataSetOptions changes
  useEffect(() => {
    if (dataSetOptions.length > 0) {
      fetchColumnsForMappingKeys();
    }
  }, [dataSetOptions]);

  // Fetch columns for mapping keys selection
  const fetchColumnsForMappingKeys = async () => {
    if (dataSetOptions.length === 0) return;

    setLoading(true);
    try {
      const columnsMap = {};
      await Promise.all(
        dataSetOptions.map(async (option) => {
          try {
            const collectionName = option.dataset_name;

            // Fetch selected fields (columns) for this collection
            const fieldsResponse = await requestCallGet(
              `${apiEndpoints.GET_COLLECTION_FIELDS}/${collectionName}`
            );
            if (fieldsResponse.status) {
              // Use selected_fields from the response
              const selectedFields =
                fieldsResponse?.data?.data?.selected_fields || [];
              columnsMap[collectionName] = selectedFields.map((field) => ({
                value: field,
                label: field,
              }));
            } else {
              columnsMap[collectionName] = [];
            }
          } catch (error) {
            console.error(
              `Error fetching keys for ${option.dataset_name}:`,
              error
            );
            columnsMap[option.dataset_name] = [];
          }
        })
      );

      setCollectionColumns(columnsMap);
    } catch (error) {
      console.error("Error fetching columns for mapping keys:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle collection selection change
  const handleCollectionSelectionChange = (selected) => {
    setSelectedCollections(selected);
    // Initialize mapping keys for newly selected collections if not already set
    const newMappingKeys = { ...collectionMappingKeys };
    selected.forEach((collectionName) => {
      if (!newMappingKeys[collectionName]) {
        newMappingKeys[collectionName] = [];
      }
    });
    setCollectionMappingKeys(newMappingKeys);
  };

  // Handle mapping key selection change for a collection
  const handleMappingKeySelectionChange = (collectionName, selectedKeys) => {
    setCollectionMappingKeys((prev) => ({
      ...prev,
      [collectionName]: selectedKeys,
    }));
  };

  // Handle condition change for a collection
  const handleConditionChange = (collectionName, conditionId, field, value) => {
    setCollectionConditions((prev) => {
      const collectionConditionsList = prev[collectionName] || [];
      const updatedConditions = collectionConditionsList.map((condition) =>
        condition.id === conditionId
          ? { ...condition, [field]: value }
          : condition
      );
      return {
        ...prev,
        [collectionName]: updatedConditions,
      };
    });
  };

  // Add new condition for a collection
  const addCondition = (collectionName) => {
    try {
      const newCondition = {
        id: `${Date.now()}_${Math.random()}`, // Unique ID as string
        column: "",
        operator: "equal",
        value: "",
      };
      setCollectionConditions((prev) => {
        const currentConditions = prev[collectionName] || [];
        return {
          ...prev,
          [collectionName]: [...currentConditions, newCondition],
        };
      });
    } catch (error) {
      console.error("Error adding condition:", error);
      setToastMessage({
        message: "Error adding condition",
        type: "error",
      });
    }
  };

  // Remove condition for a collection
  const removeCondition = (collectionName, conditionId) => {
    setCollectionConditions((prev) => ({
      ...prev,
      [collectionName]: (prev[collectionName] || []).filter(
        (condition) => condition.id !== conditionId
      ),
    }));
  };

  // Sync local logicGroup with Redux state when it updates
  useEffect(() => {
    if (logicGroups && logicGroups.length > 0 && logicGroups[0]) {
      // Update local logicGroup with the latest from Redux
      setLogicGroup((prevGroup) => {
        if (prevGroup) {
          return {
            ...prevGroup,
            recologic: logicGroups[0]?.recologic || prevGroup.recologic,
          };
        }
        return prevGroup;
      });
    }
  }, [logicGroups]);

  const fetchCollectionsAndColumns = async () => {
    setLoading(true);
    try {
      // Fetch all collections
      const collectionsResponse = await requestCallGet(
        apiEndpoints.GET_DATABASE_COLLECTIONS
      );

      if (collectionsResponse.status) {
        const collections =
          collectionsResponse?.data?.data?.collections ||
          collectionsResponse?.data?.data ||
          [];

        // Fetch columns for each collection
        const collectionsWithColumns = await Promise.all(
          collections.map(async (collectionName) => {
            try {
              const collectionNameStr =
                typeof collectionName === "string"
                  ? collectionName
                  : collectionName?.collection || collectionName;

              const fieldsResponse = await requestCallGet(
                `${apiEndpoints.GET_COLLECTION_FIELDS}/${collectionNameStr}`
              );

              if (fieldsResponse.status) {
                // Use selected_fields from the response
                const selectedFields =
                  fieldsResponse?.data?.data?.selected_fields || [];
                return {
                  dataset_name: collectionNameStr,
                  dataset_type: "Dataset",
                  tableName: collectionNameStr,
                  columns: selectedFields.map((field) => ({
                    excelColumnName: field,
                    dbcolumnName: field,
                  })),
                };
              }
              return null;
            } catch (error) {
              console.error(
                `Error fetching fields for ${collectionName}:`,
                error
              );
              return null;
            }
          })
        );

        // Filter out null values and set dataSetOptions
        const validCollections = collectionsWithColumns.filter(
          (col) => col !== null
        );
        setDataSetOptions(validCollections);
      }
    } catch (error) {
      console.error("Error fetching collections and columns:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter dataSetOptions to only show selected collections for mapping keys
  const getFilteredDataSetOptions = () => {
    if (selectedCollections.length === 0) {
      return dataSetOptions; // Show all if no collections selected
    }
    return dataSetOptions.filter((option) =>
      selectedCollections.includes(option.dataset_name)
    );
  };

  // Get mapping keys as object for sending to API
  const getMappingKeysObject = () => {
    if (selectedCollections.length === 0) {
      return null; // Return null if no collections selected
    }
    const mapping_keys = {};
    selectedCollections.forEach((collectionName) => {
      mapping_keys[collectionName] =
        collectionMappingKeys[collectionName] || [];
    });
    return mapping_keys;
  };

  // Get conditions as object for sending to API
  const getConditionsObject = () => {
    if (selectedCollections.length === 0) {
      return null; // Return null if no collections selected
    }
    const conditions = {};
    selectedCollections.forEach((collectionName) => {
      const collectionConditionsList =
        collectionConditions[collectionName] || [];
      // Filter out empty conditions and format for API
      conditions[collectionName] = collectionConditionsList
        .filter((condition) => condition.column && condition.value)
        .map((condition) => ({
          column: condition.column,
          operator: condition.operator || "equal",
          value: condition.value,
        }));
    });
    return Object.keys(conditions).length > 0 ? conditions : null;
  };

  const fetchFormulasData = async () => {
    const data = await fetchReportFormulas(reportName);
    if (data) {
      setReportData(data);
      setFormulas(data?.formulas || []);

      // Load existing mapping keys from report data
      if (data?.mapping_keys) {
        const mappingKeysData = data.mapping_keys;
        setCollectionMappingKeys(mappingKeysData);
        // Set selected collections from mapping_keys keys
        setSelectedCollections(Object.keys(mappingKeysData));
      }

      // Load existing conditions from report data
      if (data?.conditions) {
        const conditionsData = data.conditions;
        // Convert conditions array format to our state format with IDs
        const formattedConditions = {};
        Object.keys(conditionsData).forEach((collectionName) => {
          const conditionsList = conditionsData[collectionName] || [];
          formattedConditions[collectionName] = conditionsList.map(
            (condition, index) => ({
              id: `${collectionName}_${index}_${Date.now()}`,
              column: condition.column || "",
              operator: condition.operator || "equal",
              value: condition.value || "",
            })
          );
        });
        setCollectionConditions(formattedConditions);
      }

      const group = {
        recologic: data?.formulas,
        effectiveFrom: data?.created_at
          ? moment(data.created_at).format("YYYY-MM-DD")
          : moment().format("YYYY-MM-DD"),
        effectiveTo: data?.updated_at
          ? moment(data.updated_at).format("YYYY-MM-DD")
          : "",
        effectiveType: "business_date",
        id: undefined,
      };

      setLogicGroup(group);

      // Initialize Redux state so FormulaModal can save to it
      dispatch(setLogicGroups([group]));
      dispatch(setLogicData(data?.formulas));
    }
  };

  const handleBack = () => {
    navigate("/definelogic");
  };

  if (!reportName) {
    return (
      <div className="">
        <div className="text-center py-8 text-gray-500">No report selected</div>
        <div className="flex justify-start mt-4">
          <PrimaryButton label="Back" onClick={handleBack} />
        </div>
      </div>
    );
  }

  return (
    <div className="">
      <div className="flex-1 flex mb-4">
        <button onClick={handleBack}>
          <span className="material-icons-outlined mr-2">{"arrow_back"}</span>
        </button>
        <h4 className="box-title font-bold text-base">
          MANAGE FORMULAS - {reportName?.toUpperCase() || ""}
        </h4>
      </div>

      {/* Part 1: Selectable Area */}
      <div className="mb-4">
        <ExpandableCard header="Select Collections">
          <div className="pt-3 space-y-3 p-3">
            {/* Collection Selection */}
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-1">
                Collections
              </label>
              {allCollections.length === 0 ? (
                <div className="text-sm text-gray-500 italic py-2">
                  Loading collections...
                </div>
              ) : (
                <DropdownWithCheckbox
                  data={allCollections}
                  placeholder="Select collections"
                  option_value="value"
                  option_label="label"
                  selectedLabel=""
                  selectedOptions={selectedCollections}
                  setSelectedOptions={handleCollectionSelectionChange}
                />
              )}
              {allCollections.length > 0 && (
                <div className="text-xs text-gray-500 mt-1">
                  {allCollections.length} collection(s) available
                </div>
              )}
            </div>
            {console.log(collectionColumns)}
            {/* Mapping Key Selection for Each Selected Collection */}
            {selectedCollections.length > 0 && (
              <div className="space-y-2">
                <label className="block text-gray-700 text-sm font-medium mb-1">
                  Pick column(s) to set as mapping_key between collections
                </label>
                {selectedCollections?.map((collectionName) => {
                  const columns = collectionColumns[collectionName] || [];
                  console.log(columns);
                  const currentMappingKeys =
                    collectionMappingKeys[collectionName] || [];

                  return (
                    <div
                      key={collectionName}
                      className="border border-gray-200 rounded p-2 bg-gray-50"
                    >
                      <div className="font-medium text-xs mb-1 text-gray-700">
                        {collectionName}
                      </div>
                      <DropdownWithCheckbox
                        data={columns}
                        placeholder={`Select mapping keys`}
                        option_value="value"
                        option_label="label"
                        selectedLabel=""
                        selectedOptions={currentMappingKeys}
                        setSelectedOptions={(selected) =>
                          handleMappingKeySelectionChange(
                            collectionName,
                            selected
                          )
                        }
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </ExpandableCard>
      </div>

      {/* Part 2: Show Selected Tables and Fields */}
      {selectedCollections.length > 0 && (
        <div className="mb-4">
          <ExpandableCard header="Selected Collections & Mapping Keys">
            <div className="pt-3 p-2">
              <div className="space-y-3">
                {selectedCollections.map((collectionName) => {
                  const currentMappingKeys =
                    collectionMappingKeys[collectionName] || [];
                  const columns = collectionColumns[collectionName] || [];
                  const selectedFields =
                    dataSetOptions.find(
                      (opt) => opt.dataset_name === collectionName
                    )?.columns || [];

                  return (
                    <div
                      key={collectionName}
                      className="border border-gray-200 rounded-lg p-4 bg-white"
                    >
                      <div className="font-semibold text-base mb-3 text-gray-800">
                        {collectionName}
                      </div>

                      {/* Mapping Keys Section */}
                      {currentMappingKeys.length > 0 && (
                        <div className="mb-3">
                          <div className="text-xs font-medium text-gray-600 mb-2">
                            Mapping Keys:
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {currentMappingKeys.map((key, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded"
                              >
                                {key}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Selected Fields Section */}
                      {selectedFields.length > 0 && (
                        <div>
                          <div className="text-xs font-medium text-gray-600 mb-2">
                            Available Fields ({selectedFields.length}):
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {selectedFields.map((field, index) => {
                              const fieldName =
                                field.excelColumnName ||
                                field.dbcolumnName ||
                                field;
                              const isMappingKey =
                                currentMappingKeys.includes(fieldName);
                              return (
                                <span
                                  key={index}
                                  className={`px-2 py-1 text-xs font-medium rounded ${
                                    isMappingKey
                                      ? "bg-green-100 text-green-800 border border-green-300"
                                      : "bg-gray-100 text-gray-700"
                                  }`}
                                >
                                  {fieldName}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {selectedFields.length === 0 && (
                        <div className="text-xs text-gray-500 italic">
                          No fields available
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </ExpandableCard>
        </div>
      )}

      {/* Part 3: Conditional Pickup */}
      {selectedCollections.length > 0 && (
        <div className="mb-4">
          <ExpandableCard header="Conditional Pickup">
            <div className="pt-3 p-2">
              <div className="space-y-4">
                {selectedCollections.map((collectionName) => {
                  const conditions = collectionConditions[collectionName] || [];
                  const columns = collectionColumns[collectionName] || [];
                  const columnOptions = columns.map((col) => ({
                    value: col.value || col,
                    label: col.label || col.value || col,
                  }));

                  const operatorOptions = [
                    { value: "equal", label: "Equal" },
                    { value: "not_equal", label: "Not Equal" },
                    { value: "greater_than", label: "Greater Than" },
                    { value: "less_than", label: "Less Than" },
                  ];

                  return (
                    <div
                      key={collectionName}
                      className="border border-gray-200 rounded-lg p-4 bg-white"
                    >
                      <div className="font-semibold text-base mb-3 text-gray-800">
                        {collectionName}
                      </div>

                      {/* Conditions List */}
                      <div className="space-y-3">
                        {conditions.length === 0 ? (
                          <div className="text-sm text-gray-500 italic">
                            No conditions added. Click "Add Condition" to add
                            one.
                          </div>
                        ) : (
                          conditions.map((condition) => {
                            if (!condition || !condition.id) return null;
                            return (
                              <div
                                key={condition.id}
                                className="flex items-end gap-2 p-3 bg-gray-50 rounded border border-gray-200"
                              >
                                {/* Column Dropdown */}
                                <div className="flex-1">
                                  <CustomSelect
                                    label="Column"
                                    data={
                                      columnOptions && columnOptions.length > 0
                                        ? columnOptions
                                        : [
                                            {
                                              value: "",
                                              label: "No columns available",
                                            },
                                          ]
                                    }
                                    option_value="value"
                                    option_label="label"
                                    value={condition.column || ""}
                                    onChange={(e) =>
                                      handleConditionChange(
                                        collectionName,
                                        condition.id,
                                        "column",
                                        e.target.value
                                      )
                                    }
                                    placeholder="Select column"
                                  />
                                </div>

                                {/* Operator Dropdown */}
                                <div className="w-40">
                                  <CustomSelect
                                    label="Operator"
                                    data={operatorOptions}
                                    option_value="value"
                                    option_label="label"
                                    value={condition.operator || "equal"}
                                    onChange={(e) =>
                                      handleConditionChange(
                                        collectionName,
                                        condition.id,
                                        "operator",
                                        e.target.value
                                      )
                                    }
                                  />
                                </div>

                                {/* Value Input */}
                                <div className="flex-1">
                                  <CustomInput
                                    label="Value"
                                    value={condition.value || ""}
                                    onChange={(e) =>
                                      handleConditionChange(
                                        collectionName,
                                        condition.id,
                                        "value",
                                        e.target.value
                                      )
                                    }
                                    placeholder="Enter value"
                                    additionalContainerStyle={{
                                      marginBottom: "0px",
                                    }}
                                  />
                                </div>

                                {/* Remove Button */}
                                <div>
                                  <button
                                    onClick={() =>
                                      removeCondition(
                                        collectionName,
                                        condition.id
                                      )
                                    }
                                    className="px-3 py-2 text-red-600 hover:bg-red-50 rounded border border-red-200"
                                    title="Remove condition"
                                  >
                                    <i className="fa-solid fa-trash"></i>
                                  </button>
                                </div>
                              </div>
                            );
                          })
                        )}

                        {/* Add Condition Button */}
                        <div className="mt-2">
                          <PrimaryButton
                            label="Add Condition"
                            onClick={() => addCondition(collectionName)}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </ExpandableCard>
        </div>
      )}

      {logicGroup && (
        <ExpandableCard
          header={`Formulas Group - ${reportName}`}
          key={`formulas_group_${reportName}`}
        >
          <SetLogics
            group={logicGroup}
            index={0}
            customDataSetOptions={getFilteredDataSetOptions()}
            reportName={reportName}
            mappingKeys={getMappingKeysObject()}
            conditions={getConditionsObject()}
          />
        </ExpandableCard>
      )}

      {!logicGroup && reportData && (
        <BlankCard
          header={
            <h4 className="box-title font-bold text-base">
              FORMULAS ({formulas.length})
            </h4>
          }
        >
          <div className="pt-3 w-full">
            <div
              className="relative overflow-x-auto mt-2 mb-2 custom-table-style"
              style={{ maxHeight: "50vh", overflowY: "auto" }}
            >
              {formulas.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No formulas found
                </div>
              ) : (
                <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400 sticky top-0">
                    <tr>
                      <th scope="col">Formula Name</th>
                      <th scope="col">Formula Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formulas.map((formula, index) => (
                      <tr
                        key={index}
                        className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                      >
                        <td className="px-6 py-4 font-medium">
                          {formula?.formula_name || "-"}
                        </td>
                        <td className="px-6 py-4">
                          <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                            {formula?.formula_value || "-"}
                          </code>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </BlankCard>
      )}
    </div>
  );
};

export default ManageFormulas;
