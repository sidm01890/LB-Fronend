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

const ManageReasons = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const reportName = searchParams.get("report");
  const { setLoading, setToastMessage } = useLoader();

  const [reasons, setReasons] = useState([]);
  const [deltaColumns, setDeltaColumns] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    reason: "",
    description: "",
    delta_column: "",
    threshold: "",
    must_check: false,
  });
  const [formErrors, setFormErrors] = useState({});
  const [editingIndex, setEditingIndex] = useState(null);

  useEffect(() => {
    if (reportName) {
      fetchReasons();
      fetchDeltaColumns();
    }
  }, [reportName]);

  const fetchDeltaColumns = async () => {
    setLoading(true);
    try {
      const response = await requestCallGet(
        `${apiEndpoints.GET_DELTA_COLUMNS}/${reportName}/delta-columns`
      );
      if (response.status) {
        let deltaColumnsData = response?.data?.data || response?.data;
        if (!Array.isArray(deltaColumnsData)) {
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
      }
    } catch (error) {
      console.error("Error fetching delta columns:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReasons = async () => {
    setLoading(true);
    try {
      const response = await requestCallGet(
        `${apiEndpoints.GET_REASONS}/${reportName}/reasons`
      );
      if (response.status) {
        // API returns a direct array
        let reasonsData = response?.data?.data || response?.data;
        if (!Array.isArray(reasonsData)) {
          if (
            reasonsData &&
            typeof reasonsData === "object" &&
            reasonsData.reasons
          ) {
            reasonsData = reasonsData.reasons;
          } else {
            reasonsData = [];
          }
        }
        setReasons(Array.isArray(reasonsData) ? reasonsData : []);
      } else {
        setReasons([]);
        setToastMessage({
          message: response.message || "Failed to fetch reasons",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Error fetching reasons:", error);
      setReasons([]);
      setToastMessage({
        message: "Error loading reasons",
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

  const convertToCapitalWithUnderscore = (text) => {
    if (!text) return "";
    return text
      .trim()
      .toUpperCase()
      .replace(/\s+/g, "_")
      .replace(/[^A-Z0-9_]/g, "");
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.reason || formData.reason.trim() === "") {
      errors.reason = "Reason is required";
    }

    if (!formData.delta_column || formData.delta_column === "") {
      errors.delta_column = "Delta column is required";
    }

    if (!formData.threshold || formData.threshold === "") {
      errors.threshold = "Threshold is required";
    } else {
      const thresholdNum = parseFloat(formData.threshold);
      if (isNaN(thresholdNum)) {
        errors.threshold = "Threshold must be a valid number";
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    const reasonData = {
      reason: convertToCapitalWithUnderscore(formData.reason),
      description: formData.description.trim() || "",
      delta_column: formData.delta_column,
      threshold: parseFloat(formData.threshold),
      must_check: formData.must_check,
    };

    let updatedReasons = Array.isArray(reasons) ? [...reasons] : [];

    if (editingIndex !== null) {
      // Update existing reason
      updatedReasons[editingIndex] = reasonData;
    } else {
      // Add new reason
      updatedReasons.push(reasonData);
    }

    const success = await saveReasons(updatedReasons);

    if (success) {
      closeModal();
      fetchReasons();
    }
  };

  const saveReasons = async (reasonsData) => {
    setLoading(true);
    try {
      // Send the array directly
      const response = await requestCallPut(
        `${apiEndpoints.UPDATE_REASONS}/${reportName}/reasons`,
        reasonsData
      );
      if (response.status) {
        setToastMessage({
          message: response?.data?.message || "Reasons saved successfully",
          type: "success",
        });
        return true;
      } else {
        setToastMessage({
          message: response.message || "Failed to save reasons",
          type: "error",
        });
        return false;
      }
    } catch (error) {
      console.error("Error saving reasons:", error);
      setToastMessage({
        message: "Error saving reasons",
        type: "error",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const openModal = (index = null) => {
    if (index !== null && Array.isArray(reasons) && reasons[index]) {
      // Edit mode
      const reason = reasons[index];
      setFormData({
        reason: reason.reason || "",
        description: reason.description || "",
        delta_column: reason.delta_column || "",
        threshold: reason.threshold?.toString() || "",
        must_check: reason.must_check || false,
      });
      setEditingIndex(index);
    } else {
      // Add mode
      setFormData({
        reason: "",
        description: "",
        delta_column: "",
        threshold: "",
        must_check: false,
      });
      setEditingIndex(null);
    }
    setIsModalOpen(true);
    setFormErrors({});
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({
      reason: "",
      description: "",
      delta_column: "",
      threshold: "",
      must_check: false,
    });
    setFormErrors({});
    setEditingIndex(null);
  };

  const handleDelete = async (index) => {
    if (window.confirm("Are you sure you want to delete this reason?")) {
      const updatedReasons = Array.isArray(reasons)
        ? reasons.filter((_, i) => i !== index)
        : [];
      const success = await saveReasons(updatedReasons);
      if (success) {
        fetchReasons();
      }
    }
  };

  const handleBack = () => {
    navigate("/definelogic");
  };

  const deltaColumnOptions = deltaColumns.map((dc) => ({
    value: dc.delta_column_name,
    label: dc.delta_column_name,
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
            MANAGE REASONS - {reportName?.toUpperCase() || ""}
          </h4>
        </div>
        <div className="flex justify-end">
          <PrimaryButton label="Add Reason" onClick={() => openModal()} />
        </div>
      </div>
      <BlankCard
        header={
          <div className="flex justify-between items-center">
            <h4 className="box-title font-bold text-base">
              REASONS ({Array.isArray(reasons) ? reasons.length : 0})
            </h4>
          </div>
        }
      >
        <div className="pt-3 w-full">
          <div
            className="relative overflow-x-auto mt-2 mb-2 custom-table-style"
            style={{ maxHeight: "50vh", overflowY: "auto" }}
          >
            {!Array.isArray(reasons) || reasons.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No reasons found. Click "Add Reason" to create one.
              </div>
            ) : (
              <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400 sticky top-0">
                  <tr>
                    <th scope="col">Reason</th>
                    <th scope="col">Description</th>
                    <th scope="col">Delta Column</th>
                    <th scope="col">Threshold</th>
                    <th scope="col">Must Check</th>
                    <th
                      scope="col"
                      style={{ width: "150px", textAlign: "center" }}
                    >
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {Array.isArray(reasons) &&
                    reasons.map((reason, index) => (
                      <tr
                        key={index}
                        className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                      >
                        <td className="px-6 py-4 font-medium">
                          {reason?.reason || "-"}
                        </td>
                        <td className="px-6 py-4">
                          {reason?.description || "-"}
                        </td>
                        <td className="px-6 py-4">
                          {reason?.delta_column || "-"}
                        </td>
                        <td className="px-6 py-4">
                          {reason?.threshold !== undefined &&
                          reason?.threshold !== null
                            ? reason.threshold
                            : "-"}
                        </td>
                        <td className="px-6 py-4">
                          {reason?.must_check ? (
                            <span className="text-green-600">Yes</span>
                          ) : (
                            <span className="text-gray-400">No</span>
                          )}
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

      {/* Add/Edit Reason Modal */}
      {isModalOpen &&
        ReactDOM.createPortal(
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
            <div className="bg-white rounded-lg p-6 w-96 max-w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4 border-b pb-4">
                <h2 className="text-2xl font-bold">
                  {editingIndex !== null ? "Edit" : "Add"} Reason
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
                  label="Reason"
                  name="reason"
                  placeholder="Enter reason (e.g., net amount mismatched)"
                  value={formData.reason}
                  onChange={(e) => handleInputChange("reason", e.target.value)}
                  error={formErrors.reason}
                  required
                />
                <div className="text-xs text-gray-500 mt-1 mb-3">
                  Will be stored as:{" "}
                  {convertToCapitalWithUnderscore(formData.reason) ||
                    "REASON_NAME"}
                </div>

                <CustomInput
                  label="Description (Optional)"
                  name="description"
                  placeholder="Enter description"
                  value={formData.description}
                  onChange={(e) =>
                    handleInputChange("description", e.target.value)
                  }
                  error={formErrors.description}
                />

                <div className="mt-4">
                  <CustomSelect
                    label="Delta Column"
                    data={
                      deltaColumnOptions.length > 0
                        ? deltaColumnOptions
                        : [{ value: "", label: "No delta columns available" }]
                    }
                    option_value="value"
                    option_label="label"
                    value={formData.delta_column}
                    onChange={(e) =>
                      handleInputChange("delta_column", e.target.value)
                    }
                    placeholder="Select delta column"
                    error={formErrors.delta_column}
                  />
                  {formErrors.delta_column && (
                    <div className="text-red-500 text-xs mt-1">
                      {formErrors.delta_column}
                    </div>
                  )}
                </div>
                <div className="mt-2">
                  <CustomInput
                    label="Threshold"
                    name="threshold"
                    type="number"
                    step="any"
                    placeholder="Enter threshold"
                    value={formData.threshold}
                    onChange={(e) =>
                      handleInputChange("threshold", e.target.value)
                    }
                    error={formErrors.threshold}
                    required
                  />
                </div>
                <div className="mt-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.must_check}
                      onChange={(e) =>
                        handleInputChange("must_check", e.target.checked)
                      }
                      className="mr-2"
                      style={{ width: "16px", height: "16px" }}
                    />
                    <span className="text-gray-700 text-sm font-medium">
                      Must Check
                    </span>
                  </label>
                </div>

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

export default ManageReasons;
