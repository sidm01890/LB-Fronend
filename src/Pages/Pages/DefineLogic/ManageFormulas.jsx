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
import { apiEndpoints } from "../../../ServiceRequest/APIEndPoints";
import {
  requestCallGet,
  requestCallPost,
} from "../../../ServiceRequest/APIFunctions";
import { useLoader } from "../../../Utils/Loader";

const ManageFormulas = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const reportName = searchParams.get("report");
  const { fetchReportFormulas } = useLogic();
  const { setLoading } = useLoader();
  const { logicGroups } = useSelector((state) => state.LogicsService);
  const [reportData, setReportData] = useState(null);
  const [formulas, setFormulas] = useState([]);
  const [logicGroup, setLogicGroup] = useState(null);
  const [dataSetOptions, setDataSetOptions] = useState([]);

  useEffect(() => {
    if (reportName) {
      fetchFormulasData();
      fetchCollectionsAndColumns();
    }
  }, [reportName]);

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

  const fetchFormulasData = async () => {
    const data = await fetchReportFormulas(reportName);
    if (data) {
      setReportData(data);
      setFormulas(data?.formulas || []);

      // Transform formulas data into SetLogics format
      // SetLogics expects a group with recologic array
      const transformedFormulas = (data?.formulas || []).map(
        (formula, index) => ({
          logicName: formula?.formula_name || `Formula ${index + 1}`,
          logicNameKey: formula?.formula_name || `formula_${index + 1}`,
          excelFormulaText: formula?.formula_value || "",
          formulaText: formula?.formula_value || "",
          fields: [],
          active_group_index: 0,
        })
      );

      const group = {
        recologic: transformedFormulas,
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
      dispatch(setLogicData(transformedFormulas));
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

      {reportData && (
        <div className="mb-4 p-3 bg-blue-50 rounded">
          <p className="text-sm">
            <span className="font-semibold">Report Name:</span>{" "}
            {reportData.report_name}
            {" | "}
            <span className="font-semibold">Total Formulas:</span>{" "}
            {reportData.formulas_count || formulas.length}
          </p>
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
            customDataSetOptions={dataSetOptions}
            reportName={reportName}
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
