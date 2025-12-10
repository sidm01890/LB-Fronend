const BLANK_FORMULA = {
  id: 1,
  logicName: "",
  fields: [
    {
      type: "data_field",
      dataset_type: "",
      selectedDataSetValue: "",
      selectedFieldValue: "",
      customFieldValue: "",
      startBrackets: [],
      endBrackets: [],
    },
    {
      type: "operator",
      dataset_type: "",
      selectedFieldValue: "",
    },
    {
      type: "data_field",
      dataset_type: "",
      selectedDataSetValue: "",
      selectedFieldValue: "",
      customFieldValue: "",
      startBrackets: [],
      endBrackets: [],
    },
  ],
  formulaText: "",
  logicNameKey: "",
  multipleColumn: false,
};

export const BLANK_SIMPLE_FIELD = {
  id: 1,
  logicName: "",
  fields: [
    {
      type: "data_field",
      dataset_type: "",
      selectedDataSetValue: "",
      selectedFieldValue: "",
      customFieldValue: "",
      startBrackets: [],
      endBrackets: [],
    },
  ],
  formulaText: "",
  logicNameKey: "",
  multipleColumn: false,
};

export const BLANK_CONDITIONAL_MAPPING = {
  id: 1,
  logicName: "",
  fields: [
    {
      type: "data_field",
      dataset_type: "",
      selectedDataSetValue: "",
      selectedFieldValue: "",
      customFieldValue: "",
      startBrackets: [],
      endBrackets: [],
    },
  ],
  formulaText: "",
  logicNameKey: "",
  multipleColumn: false,
  conditions: [],
  modalType: "conditionalMapping",
};

export default BLANK_FORMULA;
