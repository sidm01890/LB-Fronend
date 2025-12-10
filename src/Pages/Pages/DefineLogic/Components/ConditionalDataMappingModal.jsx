import React, { useState } from "react";
import "../DefineStyle.css";
import useUtilFunctions from "../useUtilFunctions";
import PrimaryButton from "../../../../components/PrimaryButton";
import OutlineButton from "../../../../components/OutlineButton";
import { useDispatch, useSelector } from "react-redux";
import {
  setActiveLogic,
  setLogicData,
  setLogicGroups,
} from "../../../../Redux/Slices/Logics";
import { BLANK_CONDITIONAL_MAPPING } from "../constants";
import Select from "react-select";

const CONDITION_TYPES = [
  { value: "equal", label: "Equal" },
  { value: "greater_than", label: "Greater than" },
  { value: "less_than", label: "Less than" },
  { value: "greater_equal", label: "Greater than or equal" },
  { value: "less_equal", label: "Less than or equal" },
  { value: "between", label: "Between" },
];

const ConditionalDataMappingModal = ({ dataSetOptions }) => {
  const dispatch = useDispatch();
  const [mappingError, setMappingError] = useState(null);
  const [conditions, setConditions] = useState([
    {
      id: Date.now(),
      conditionType: "equal",
      value1: "",
      value2: "",
      formulaValue: "",
    },
  ]);

  let {
    logicData,
    activeLogic: logicItem,
    activeLogicIndex,
    logicGroups,
  } = useSelector((state) => state.LogicsService);
  const { renderFormula, handleFieldValueChange, onChangeCustomInput } =
    useUtilFunctions(dataSetOptions);

  const getSelectedOption = (value, key, options) => {
    if (!value || !options) return null;
    return options.find((option) => option[key] === value) || null;
  };

  const optionsForDataSet = () => {
    const baseOptions = dataSetOptions || [];
    let options = [...baseOptions];

    // Add previously created formulas to the options
    // Exclude the current formula being edited (if editing)
    if (logicData && logicData.length > 0) {
      logicData.forEach((formula, index) => {
        // Skip the current formula if we're editing it
        if (activeLogicIndex !== -1 && index === activeLogicIndex) {
          return;
        }
        // Add formula to options if it has a logicNameKey
        if (formula?.logicNameKey) {
          options.push({
            ...formula,
            dataset_name: formula.logicNameKey,
            dataset_type: "Formula",
          });
        }
      });
    }

    return options;
  };

  const onSelectFieldValue = (
    datasetName,
    logicItem,
    index,
    isCustom,
    option
  ) => {
    let updatedLogicItem = { ...logicItem };
    let fields = [...updatedLogicItem.fields];
    let selectedField = { ...fields[index] };

    if (isCustom) {
      selectedField = {
        ...selectedField,
        dataset_type: "Custom",
        selectedFieldValue: "Custom",
        selectedDataSetValue: "",
        customFieldValue: "",
      };
    } else {
      // Check if it's a formula (from previously created formulas)
      const isFormula =
        option?.dataset_type === "Formula" ||
        logicData?.some((formula) => formula?.logicNameKey === datasetName);

      if (isFormula) {
        // If it's a formula, set it up as a formula reference
        selectedField = {
          ...selectedField,
          dataset_type: "Formula",
          selectedFieldValue: datasetName,
          selectedDataSetValue: "",
          customFieldValue: "",
          selectedTableName: datasetName,
          selectedTableColumn: "",
        };
      } else {
        // It's a regular data set (collection/table)
        const selectedDataSet = dataSetOptions.find(
          (ds) => ds.dataset_name === datasetName
        );

        selectedField = {
          ...selectedField,
          dataset_type: selectedDataSet?.dataset_type || "",
          selectedFieldValue: datasetName,
          selectedDataSetValue: "",
          customFieldValue: "",
          selectedTableName: option?.tableName || datasetName,
          selectedTableColumn: option?.excelColumnName || "",
        };

        // If columns are available and only one column, auto-select it
        if (selectedDataSet?.columns?.length === 1) {
          selectedField.selectedDataSetValue =
            selectedDataSet.columns[0].excelColumnName;
          selectedField.selectedTableColumn =
            selectedDataSet.columns[0].excelColumnName;
        }
      }
    }

    fields[index] = selectedField;
    updatedLogicItem.fields = fields;
    dispatch(setActiveLogic(updatedLogicItem));
  };

  const onSelectColumnValue = (columnValue, logicItem, index, option) => {
    let updatedLogicItem = { ...logicItem };
    let fields = [...updatedLogicItem.fields];
    let selectedField = { ...fields[index] };

    selectedField = {
      ...selectedField,
      selectedDataSetValue: columnValue,
      selectedTableColumn: option?.excelColumnName || columnValue,
    };

    fields[index] = selectedField;
    updatedLogicItem.fields = fields;
    dispatch(setActiveLogic(updatedLogicItem));
  };

  const addCondition = () => {
    setConditions([
      ...conditions,
      {
        id: Date.now(),
        conditionType: "equal",
        value1: "",
        value2: "",
        formulaValue: "",
      },
    ]);
  };

  const removeCondition = (conditionId) => {
    if (conditions.length > 1) {
      setConditions(conditions.filter((cond) => cond.id !== conditionId));
    }
  };

  const updateCondition = (conditionId, field, value) => {
    setConditions(
      conditions.map((cond) =>
        cond.id === conditionId ? { ...cond, [field]: value } : cond
      )
    );
  };

  const saveMapping = () => {
    if (logicItem?.logicName?.toString()?.trim() === "") {
      setMappingError("Please enter mapping name");
      setTimeout(() => {
        setMappingError(null);
      }, 5000);
      return;
    }

    const field = logicItem?.fields?.[0];
    if (!field?.selectedFieldValue && !field?.customFieldValue) {
      setMappingError("Please select a field or formula");
      setTimeout(() => {
        setMappingError(null);
      }, 5000);
      return;
    }

    // If it's a data field (not custom and not formula), ensure column is selected
    if (
      field?.dataset_type !== "Custom" &&
      field?.dataset_type !== "Formula" &&
      field?.selectedFieldValue &&
      !field?.selectedDataSetValue
    ) {
      setMappingError("Please select a column");
      setTimeout(() => {
        setMappingError(null);
      }, 5000);
      return;
    }

    // Validate conditions
    for (let condition of conditions) {
      if (condition.conditionType === "between") {
        if (!condition.value1 || !condition.value2) {
          setMappingError("Please fill both values for 'Between' condition");
          setTimeout(() => {
            setMappingError(null);
          }, 5000);
          return;
        }
      } else {
        if (!condition.value1) {
          setMappingError("Please fill the value for condition");
          setTimeout(() => {
            setMappingError(null);
          }, 5000);
          return;
        }
      }
      // Validate formula value
      if (!condition.formulaValue || condition.formulaValue.trim() === "") {
        setMappingError("Please fill the formula value for each condition");
        setTimeout(() => {
          setMappingError(null);
        }, 5000);
        return;
      }
    }

    let processedFormula = renderFormula(logicItem);
    let currentLogicItem = {
      ...logicItem,
      formulaText: processedFormula?.normalizedFormula,
      excelFormulaText: processedFormula?.excelFormulaText,
      logicNameKey: processedFormula?.logicNameKey,
      conditions: conditions.map((cond) => ({
        conditionType: cond.conditionType,
        value1: cond.value1,
        value2: cond.value2 || undefined,
        formulaValue: cond.formulaValue,
      })),
      modalType: "conditionalMapping",
    };
    let allLogics = [...logicData];
    if (activeLogicIndex === -1) {
      allLogics.push(currentLogicItem);
    } else {
      allLogics[activeLogicIndex] = currentLogicItem;
    }

    dispatch(setLogicData(allLogics));

    let groupList = [...logicGroups];
    let activeGroup = { ...groupList[logicItem?.active_group_index] };
    activeGroup = { ...activeGroup, recologic: allLogics };
    groupList[logicItem?.active_group_index] = activeGroup;
    dispatch(setLogicGroups(groupList));
    dispatch(setActiveLogic(null));
  };

  const field = logicItem?.fields?.[0] || {};
  // Check if selected field is a formula
  const isFormulaSelected =
    field?.dataset_type === "Formula" ||
    logicData?.some(
      (formula) => formula?.logicNameKey === field?.selectedFieldValue
    );
  const selectedDataSet = !isFormulaSelected
    ? dataSetOptions?.find(
        (ds) => ds.dataset_name === field?.selectedFieldValue
      )
    : null;
  const columns = selectedDataSet?.columns || [];

  // Load conditions from logicItem if editing
  React.useEffect(() => {
    if (logicItem?.conditions && logicItem.conditions.length > 0) {
      setConditions(
        logicItem.conditions.map((cond, index) => ({
          id: cond.id || Date.now() + index,
          conditionType: cond.conditionType || "equal",
          value1: cond.value1 || "",
          value2: cond.value2 || "",
          formulaValue: cond.formulaValue || "",
        }))
      );
    } else if (activeLogicIndex === -1) {
      // Reset to default if adding new
      setConditions([
        {
          id: Date.now(),
          conditionType: "equal",
          value1: "",
          value2: "",
          formulaValue: "",
        },
      ]);
    }
  }, [logicItem?.conditions, activeLogicIndex]);

  return (
    <div className="fixed-formula-modal">
      <div className="formula-area flex flex-col">
        <div className="header p-3">
          <p>
            CONDITIONAL DATA MAPPING {"  "}
            {mappingError && (
              <span style={{ fontSize: "11px", color: "#ff0000" }}>
                {mappingError}
              </span>
            )}
          </p>
          <div className="flex gap-5">
            <div className="flex gap-2">
              <PrimaryButton
                label="ADD"
                onClick={() => saveMapping()}
                disabled={!renderFormula(logicItem)?.isValid}
              />
              <OutlineButton
                label="RESET"
                onClick={() => {
                  dispatch(setActiveLogic(BLANK_CONDITIONAL_MAPPING));
                  setConditions([
                    {
                      id: Date.now(),
                      conditionType: "equal",
                      value1: "",
                      value2: "",
                      formulaValue: "",
                    },
                  ]);
                }}
              />
            </div>
            <button
              onClick={() => dispatch(setActiveLogic(null))}
              className="justify-center flex items-center"
            >
              <span className="material-icons-outlined mr-2">close</span>
            </button>
          </div>
        </div>
        <div className="flex-1 p-3" style={{ overflowY: "auto" }}>
          <div>
            <div className="logicView">
              <div className="flex mb-3">
                <div className="flex w-36 ">
                  <label>
                    Mapping Name <span className="text-red-400">*</span>
                  </label>
                </div>
                <div className="w-100 px-3">
                  <input
                    type="text"
                    className="h-10 w-100 rounded-s px-2"
                    value={logicItem?.logicName || ""}
                    onChange={(e) => {
                      handleFieldValueChange("logicName", e.target.value);
                    }}
                  />
                </div>
              </div>
              <div className="flex mb-3">
                <div className="flex w-36 ">
                  <label>
                    Field/Formula <span className="text-red-400">*</span>
                  </label>
                </div>
                <div className="w-100 px-3">
                  <div style={{ width: "100%", maxWidth: "400px" }}>
                    <Select
                      value={getSelectedOption(
                        field?.selectedFieldValue,
                        "dataset_name",
                        optionsForDataSet()
                      )}
                      style={{ height: 20, width: "100%" }}
                      menuPortalTarget={document.body}
                      onChange={(e) => {
                        const isCustom = e.dataset_name === "Custom";
                        onSelectFieldValue(
                          e.dataset_name,
                          logicItem,
                          0,
                          isCustom,
                          e
                        );
                      }}
                      getOptionLabel={(option) => option.dataset_name}
                      getOptionValue={(option) => option.dataset_name}
                      options={optionsForDataSet().map((option) => {
                        return option;
                      })}
                      placeholder="Select Collection/Table/Formula"
                    />
                  </div>
                  {field?.dataset_type === "Custom" ? (
                    <div
                      style={{
                        width: "100%",
                        maxWidth: "400px",
                        marginTop: "10px",
                      }}
                    >
                      <input
                        type="text"
                        value={field?.customFieldValue || ""}
                        className="customField h-10 w-100 rounded-s px-2"
                        onChange={(e) => {
                          onChangeCustomInput(e.target.value, logicItem, 0);
                        }}
                        placeholder="Enter custom value"
                        style={{ backgroundColor: "#ffffff" }}
                      />
                    </div>
                  ) : !isFormulaSelected &&
                    field?.selectedFieldValue &&
                    columns.length > 0 ? (
                    <div
                      style={{
                        width: "100%",
                        maxWidth: "400px",
                        marginTop: "10px",
                      }}
                    >
                      <Select
                        value={getSelectedOption(
                          field?.selectedDataSetValue,
                          "excelColumnName",
                          columns
                        )}
                        menuPortalTarget={document.body}
                        onChange={(e) => {
                          onSelectColumnValue(
                            e.excelColumnName,
                            logicItem,
                            0,
                            e
                          );
                        }}
                        getOptionLabel={(option) => option.excelColumnName}
                        getOptionValue={(option) => option.excelColumnName}
                        options={columns.map((option) => {
                          return option;
                        })}
                        placeholder="Select Column"
                      />
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Conditions Section */}
              <div className="flex mb-3">
                <div className="flex w-36 ">
                  <label>
                    Conditions <span className="text-red-400">*</span>
                  </label>
                </div>
                <div className="w-100 px-3">
                  {conditions.map((condition, index) => (
                    <div
                      key={condition.id}
                      className="flex gap-2 mb-2 items-end"
                      style={{ maxWidth: "800px" }}
                    >
                      <div style={{ width: "200px" }}>
                        <Select
                          value={getSelectedOption(
                            condition.conditionType,
                            "value",
                            CONDITION_TYPES
                          )}
                          menuPortalTarget={document.body}
                          onChange={(e) => {
                            updateCondition(
                              condition.id,
                              "conditionType",
                              e.value
                            );
                            // Clear value2 if not "between"
                            if (e.value !== "between") {
                              updateCondition(condition.id, "value2", "");
                            }
                          }}
                          getOptionLabel={(option) => option.label}
                          getOptionValue={(option) => option.value}
                          options={CONDITION_TYPES}
                          placeholder="Condition Type"
                        />
                      </div>
                      <div style={{ width: "150px" }}>
                        <input
                          type="text"
                          className="h-10 w-100 rounded-s px-2"
                          value={condition.value1 || ""}
                          onChange={(e) => {
                            updateCondition(
                              condition.id,
                              "value1",
                              e.target.value
                            );
                          }}
                          placeholder="Value 1"
                        />
                      </div>
                      {condition.conditionType === "between" && (
                        <div style={{ width: "150px" }}>
                          <input
                            type="text"
                            className="h-10 w-100 rounded-s px-2"
                            value={condition.value2 || ""}
                            onChange={(e) => {
                              updateCondition(
                                condition.id,
                                "value2",
                                e.target.value
                              );
                            }}
                            placeholder="Value 2"
                          />
                        </div>
                      )}
                      <div style={{ width: "150px" }}>
                        <input
                          type="text"
                          className="h-10 w-100 rounded-s px-2"
                          value={condition.formulaValue || ""}
                          onChange={(e) => {
                            updateCondition(
                              condition.id,
                              "formulaValue",
                              e.target.value
                            );
                          }}
                          placeholder="Formula Value"
                        />
                      </div>
                      <div className="flex gap-2">
                        {conditions.length > 1 && (
                          <button
                            onClick={() => removeCondition(condition.id)}
                            className="p-2 text-red-500 hover:text-red-700"
                            title="Remove condition"
                          >
                            <i className="fa-solid fa-trash"></i>
                          </button>
                        )}
                        {index === conditions.length - 1 && (
                          <button
                            onClick={addCondition}
                            className="p-2 text-green-500 hover:text-green-700"
                            title="Add condition"
                          >
                            <i className="fa-solid fa-plus"></i>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="footer p-3">
          <MappingText formulaObj={renderFormula(logicItem)} />
        </div>
      </div>
    </div>
  );
};

export default ConditionalDataMappingModal;

const MappingText = ({ formulaObj }) => {
  return (
    <div>
      <b>{formulaObj?.excelFormulaText}</b>
      {!formulaObj?.isValid && (
        <span style={{ color: "#ff0000", fontSize: "9px" }}>
          {" "}
          ({formulaObj?.message})
        </span>
      )}
    </div>
  );
};
