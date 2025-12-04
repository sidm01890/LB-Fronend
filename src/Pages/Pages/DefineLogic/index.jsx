import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import "../../Styles/DefineLogic.css";
import ExpandableCard from "./ExpandableCard";
import ManageDataSet from "./Components/ManageDataSet";
import { useSelector } from "react-redux";
import SetLogics from "./SetLogics";
import useLogic from "./useLogic";
import moment from "moment";
import BlankCard from "../../../components/BlankCard";
import PrimaryButton from "../../../components/PrimaryButton";
import SecondaryButton from "../../../components/SecondaryButton";
import CustomInput from "../../../components/CustomInput";
import OutlineButton from "../../../components/OutlineButton";
import { useNavigate } from "react-router-dom";

const DefineLogic = () => {
  const navigate = useNavigate();
  const { getTenderList, fetchReportsFormulas, createReportFormula } =
    useLogic();
  let { tableList, logicGroups } = useSelector((state) => state.LogicsService);
  const [reportsList, setReportsList] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    report_name: "",
    formulas: "",
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    getTenderList();
    fetchReportsData();
  }, []);

  const fetchReportsData = async () => {
    const data = await fetchReportsFormulas();
    setReportsList(data);
  };

  const openModal = () => {
    setIsModalOpen(true);
    setFormData({
      report_name: "",
      formulas: "",
    });
    setFormErrors({});
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({
      report_name: "",
      formulas: "",
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

    if (!formData.report_name || formData.report_name.trim() === "") {
      errors.report_name = "Report name is required";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    // Parse formulas from comma-separated string or JSON array
    let formulasArray = [];
    if (formData.formulas && formData.formulas.trim() !== "") {
      try {
        // Try to parse as JSON first
        formulasArray = JSON.parse(formData.formulas);
        if (!Array.isArray(formulasArray)) {
          // If not an array, treat as comma-separated string
          formulasArray = formData.formulas
            .split(",")
            .map((item) => item.trim())
            .filter((item) => item !== "");
        }
      } catch (e) {
        // If JSON parse fails, treat as comma-separated string
        formulasArray = formData.formulas
          .split(",")
          .map((item) => item.trim())
          .filter((item) => item !== "");
      }
    }

    const success = await createReportFormula(
      formData.report_name.trim(),
      formulasArray
    );

    if (success) {
      closeModal();
      // Refresh the reports list
      fetchReportsData();
    }
  };

  const handleViewColumns = (report) => {
    navigate(`/definelogic/manage-formulas?report=${report?.report_name}`);
  };

  const getGroupName = (item, index) => {
    let groupName = `Group ${index + 1} (`;
    if (item?.effectiveFrom) {
      groupName += moment(item?.effectiveFrom).format("DD MMM, YYYY");
    } else {
      groupName += "From Start";
    }
    groupName += " to ";
    if (item?.effectiveTo && item.effectiveTo !== "2099-12-31") {
      groupName += moment(item?.effectiveTo).format("DD MMM, YYYY");
    } else {
      groupName += " Till Date";
    }

    groupName += ")";
    return groupName;
  };

  return (
    <div className="">
      {/* Reports Table */}
      <BlankCard
        header={
          <h4 className="box-title font-bold text-base">SUMMARY TABLES</h4>
        }
      >
        <div className="pt-3 w-full">
          <div className="flex">
            <div className="flex-1 flex justify-start items-center">
              <p className="text-black-600">LIST OF SUMMARY TABLES</p>
            </div>
            <div className="flex-1 flex justify-end items-center">
              <div>
                <PrimaryButton label="Add Report" onClick={openModal} />
              </div>
            </div>
          </div>
          <div
            className="relative overflow-x-auto mt-2 mb-2 custom-table-style"
            style={{ maxHeight: "50vh", overflowY: "auto" }}
          >
            {reportsList.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No summary tables found
              </div>
            ) : (
              <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400 sticky top-0">
                  <tr>
                    <th scope="col">Table Name</th>
                    <th scope="col">Total Columns (Formulas)</th>
                    <th
                      scope="col flex"
                      style={{
                        width: "180px",
                        textAlign: "center",
                      }}
                    >
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {reportsList.map((report, index) => (
                    <tr
                      key={index}
                      className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                    >
                      <td className="px-6 py-4">{report?.report_name}</td>
                      <td className="px-6 py-4">{report?.formulas_count}</td>
                      <td className="px-6 py-4 flex justify-center items-center">
                        <OutlineButton
                          label="Manage Formulas"
                          onClick={() => handleViewColumns(report)}
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

      {/* Add Report Modal */}
      {isModalOpen &&
        ReactDOM.createPortal(
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
            <div className="bg-white rounded-lg p-6 w-96 max-w-full">
              <div className="flex justify-between items-center mb-4 border-b pb-4">
                <h2 className="text-2xl font-bold">Add Report</h2>
                <button
                  onClick={closeModal}
                  className="text-gray-700 hover:text-gray-900 text-2xl font-bold"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <CustomInput
                  label="Report Name"
                  name="report_name"
                  placeholder="Enter report name"
                  value={formData.report_name}
                  onChange={(e) =>
                    handleInputChange("report_name", e.target.value)
                  }
                  error={formErrors.report_name}
                  required
                />

                <div className="flex justify-end gap-3 mt-6">
                  <SecondaryButton
                    label="Close"
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

export default DefineLogic;
