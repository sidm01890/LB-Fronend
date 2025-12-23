import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import ReactDOM from "react-dom";
import "../../Styles/DefineLogic.css";
import BlankCard from "../../../components/BlankCard";
import PrimaryButton from "../../../components/PrimaryButton";
import SecondaryButton from "../../../components/SecondaryButton";
import CustomInput from "../../../components/CustomInput";
import CustomSelect from "../../../components/CustomSelect";
import { apiEndpoints } from "../../../ServiceRequest/APIEndPoints";
import {
  requestCallGet,
  requestCallPut,
} from "../../../ServiceRequest/APIFunctions";
import { useLoader } from "../../../Utils/Loader";
import useLogic from "./useLogic";

const ManageDeltaColumns = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const reportName = searchParams.get("report");
  const { fetchReportFormulas } = useLogic();
  const { setLoading, setToastMessage } = useLoader();

  const [deltaColumns, setDeltaColumns] = useState([]);
  const [formulas, setFormulas] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    delta_column_name: "",
    first_formula: "",
    second_formula: "",
  });
  const [formErrors, setFormErrors] = useState({});
  const [editingIndex, setEditingIndex] = useState(null);

  useEffect(() => {
    if (reportName) {
      fetchDeltaColumns();
      fetchFormulas();
    }
  }, [reportName]);

  const fetchFormulas = async () => {
    setLoading(true);
    try {
      const data = await fetchReportFormulas(reportName);
      if (data && data.formulas) {
        // Extract formula names from formulas array
        const formulaNames = data.formulas
          .map((formula) => formula?.logicNameKey || formula?.logicName)
          .filter((name) => name);
        setFormulas(formulaNames);
      }
    } catch (error) {
      console.error("Error fetching formulas:", error);
      setToastMessage({
        message: "Error loading formulas",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchDeltaColumns = async () => {
    setLoading(true);
    try {
      const response = await requestCallGet(
        `${apiEndpoints.GET_DELTA_COLUMNS}/${reportName}/delta-columns`
      );
      if (response.status) {
        // API returns a direct array, not wrapped in an object
        let deltaColumnsData = response?.data?.data || response?.data;

        // Ensure we always get an array
        if (!Array.isArray(deltaColumnsData)) {
          // If response is wrapped in delta_columns object, extract it (backward compatibility)
          if (
            deltaColumnsData &&
            typeof deltaColumnsData === "object" &&
            deltaColumnsData.delta_columns
          ) {
            deltaColumnsData = deltaColumnsData.delta_columns;
          } else {
            deltaColumnsData = [];
          }
        }

        setDeltaColumns(
          Array.isArray(deltaColumnsData) ? deltaColumnsData : []
        );
      } else {
        setDeltaColumns([]);
        setToastMessage({
          message: response.message || "Failed to fetch delta columns",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Error fetching delta columns:", error);
      setDeltaColumns([]);
      setToastMessage({
        message: "Error loading delta columns",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
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

    if (
      !formData.delta_column_name ||
      formData.delta_column_name.trim() === ""
    ) {
      errors.delta_column_name = "Delta column name is required";
    }

    if (!formData.first_formula || formData.first_formula === "") {
      errors.first_formula = "First formula is required";
    }

    if (!formData.second_formula || formData.second_formula === "") {
      errors.second_formula = "Second formula is required";
    }

    if (formData.first_formula === formData.second_formula) {
      errors.second_formula =
        "Second formula must be different from first formula";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    const deltaColumnData = {
      delta_column_name: formData.delta_column_name.trim(),
      first_formula: formData.first_formula,
      second_formula: formData.second_formula,
      value: `${formData.first_formula} - ${formData.second_formula}`,
    };

    let updatedDeltaColumns = Array.isArray(deltaColumns)
      ? [...deltaColumns]
      : [];

    if (editingIndex !== null) {
      // Update existing delta column
      updatedDeltaColumns[editingIndex] = deltaColumnData;
    } else {
      // Add new delta column
      updatedDeltaColumns.push(deltaColumnData);
    }

    const success = await saveDeltaColumns(updatedDeltaColumns);

    if (success) {
      closeModal();
      fetchDeltaColumns();
    }
  };

  const saveDeltaColumns = async (deltaColumnsData) => {
    setLoading(true);
    try {
      // Send the array directly, not wrapped in delta_columns object
      const response = await requestCallPut(
        `${apiEndpoints.UPDATE_DELTA_COLUMNS}/${reportName}/delta-columns`,
        deltaColumnsData
      );
      if (response.status) {
        setToastMessage({
          message:
            response?.data?.message || "Delta columns saved successfully",
          type: "success",
        });
        return true;
      } else {
        setToastMessage({
          message: response.message || "Failed to save delta columns",
          type: "error",
        });
        return false;
      }
    } catch (error) {
      console.error("Error saving delta columns:", error);
      setToastMessage({
        message: "Error saving delta columns",
        type: "error",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const openModal = (index = null) => {
    if (index !== null && Array.isArray(deltaColumns) && deltaColumns[index]) {
      // Edit mode
      const deltaColumn = deltaColumns[index];
      setFormData({
        delta_column_name: deltaColumn.delta_column_name || "",
        first_formula: deltaColumn.first_formula || "",
        second_formula: deltaColumn.second_formula || "",
      });
      setEditingIndex(index);
    } else {
      // Add mode
      setFormData({
        delta_column_name: "",
        first_formula: "",
        second_formula: "",
      });
      setEditingIndex(null);
    }
    setIsModalOpen(true);
    setFormErrors({});
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({
      delta_column_name: "",
      first_formula: "",
      second_formula: "",
    });
    setFormErrors({});
    setEditingIndex(null);
  };

  const handleDelete = async (index) => {
    if (window.confirm("Are you sure you want to delete this delta column?")) {
      const updatedDeltaColumns = Array.isArray(deltaColumns)
        ? deltaColumns.filter((_, i) => i !== index)
        : [];
      const success = await saveDeltaColumns(updatedDeltaColumns);
      if (success) {
        fetchDeltaColumns();
      }
    }
  };

  const handleBack = () => {
    navigate("/definelogic");
  };

  const formulaOptions = formulas.map((formula) => ({
    value: formula,
    label: formula,
  }));

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
        <div className="flex-1 flex items-center">
          <button onClick={handleBack}>
            <span className="material-icons-outlined mr-2">{"arrow_back"}</span>
          </button>
          <h4 className="box-title font-bold text-base mb-1">
            MANAGE DELTA COLUMNS - {reportName?.toUpperCase() || ""}
          </h4>
        </div>
        <div className="flex justify-end">
          <PrimaryButton label="Add Delta Column" onClick={() => openModal()} />
        </div>
      </div>
      <BlankCard
        header={
          <div>
            <div className="flex justify-between items-center">
              <h4 className="box-title font-bold text-base">
                DELTA COLUMNS (
                {Array.isArray(deltaColumns) ? deltaColumns.length : 0})
              </h4>
            </div>
          </div>
        }
      >
        <div className="pt-3 w-full">
          <div
            className="relative overflow-x-auto mt-2 mb-2 custom-table-style"
            style={{ maxHeight: "50vh", overflowY: "auto" }}
          >
            {!Array.isArray(deltaColumns) || deltaColumns.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No delta columns found. Click "Add Delta Column" to create one.
              </div>
            ) : (
              <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400 sticky top-0">
                  <tr>
                    <th scope="col">Delta Column Name</th>
                    <th scope="col">First Formula</th>
                    <th scope="col">Second Formula</th>
                    <th scope="col">Value</th>
                    <th
                      scope="col"
                      style={{ width: "150px", textAlign: "center" }}
                    >
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {Array.isArray(deltaColumns) &&
                    deltaColumns.map((deltaColumn, index) => (
                      <tr
                        key={index}
                        className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                      >
                        <td className="px-6 py-4 font-medium">
                          {deltaColumn?.delta_column_name || "-"}
                        </td>
                        <td className="px-6 py-4">
                          {deltaColumn?.first_formula || "-"}
                        </td>
                        <td className="px-6 py-4">
                          {deltaColumn?.second_formula || "-"}
                        </td>
                        <td className="px-6 py-4">
                          <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                            {deltaColumn?.value ||
                              `${deltaColumn?.first_formula || ""} - ${
                                deltaColumn?.second_formula || ""
                              }`}
                          </code>
                        </td>
                        <td className="px-6 py-4 flex justify-center items-center gap-3">
                          <button
                            onClick={() => openModal(index)}
                            style={{
                              backgroundColor: "#007bff",
                              color: "#fff",
                              padding: "5px 10px",
                              borderRadius: "5px",
                            }}
                          >
                            <i className="fa-solid fa-pencil"></i>
                          </button>
                          <button
                            onClick={() => handleDelete(index)}
                            style={{
                              backgroundColor: "#dc3545",
                              color: "#fff",
                              padding: "5px 10px",
                              borderRadius: "5px",
                            }}
                          >
                            <i className="fa-solid fa-trash"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </BlankCard>

      {/* Add/Edit Delta Column Modal */}
      {isModalOpen &&
        ReactDOM.createPortal(
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
            <div className="bg-white rounded-lg p-6 w-96 max-w-full">
              <div className="flex justify-between items-center mb-4 border-b pb-4">
                <h2 className="text-2xl font-bold">
                  {editingIndex !== null ? "Edit" : "Add"} Delta Column
                </h2>
                <button
                  onClick={closeModal}
                  className="text-gray-700 hover:text-gray-900 text-2xl font-bold"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <CustomInput
                  label="Delta Column Name"
                  name="delta_column_name"
                  placeholder="Enter delta column name"
                  value={formData.delta_column_name}
                  onChange={(e) =>
                    handleInputChange("delta_column_name", e.target.value)
                  }
                  error={formErrors.delta_column_name}
                  required
                />

                <div className="mt-4">
                  <CustomSelect
                    label="First Formula"
                    data={
                      formulaOptions.length > 0
                        ? formulaOptions
                        : [{ value: "", label: "No formulas available" }]
                    }
                    option_value="value"
                    option_label="label"
                    value={formData.first_formula}
                    onChange={(e) =>
                      handleInputChange("first_formula", e.target.value)
                    }
                    placeholder="Select first formula"
                    error={formErrors.first_formula}
                  />
                  {formErrors.first_formula && (
                    <div className="text-red-500 text-xs mt-1">
                      {formErrors.first_formula}
                    </div>
                  )}
                </div>

                <div className="mt-4">
                  <CustomSelect
                    label="Second Formula"
                    data={
                      formulaOptions.length > 0
                        ? formulaOptions
                        : [{ value: "", label: "No formulas available" }]
                    }
                    option_value="value"
                    option_label="label"
                    value={formData.second_formula}
                    onChange={(e) =>
                      handleInputChange("second_formula", e.target.value)
                    }
                    placeholder="Select second formula"
                    error={formErrors.second_formula}
                  />
                  {formErrors.second_formula && (
                    <div className="text-red-500 text-xs mt-1">
                      {formErrors.second_formula}
                    </div>
                  )}
                </div>

                {formData.first_formula && formData.second_formula && (
                  <div className="mt-4 p-3 bg-gray-50 rounded">
                    <label className="block text-gray-700 text-sm font-medium mb-1">
                      Preview Value
                    </label>
                    <code className="text-sm">
                      {formData.first_formula} - {formData.second_formula}
                    </code>
                  </div>
                )}

                <div className="flex justify-end gap-3 mt-6">
                  <SecondaryButton
                    label="Cancel"
                    onClick={(e) => {
                      e.preventDefault();
                      closeModal();
                    }}
                  />
                  <PrimaryButton label="Save" onClick={handleSubmit} />
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default ManageDeltaColumns;
