import React, { useEffect, useRef, useState } from "react";
import BlankCard from "../../../components/BlankCard";
import PrimaryButton from "../../../components/PrimaryButton";
import SecondaryButton from "../../../components/SecondaryButton";
import { FileUploader } from "react-drag-drop-files";
import moment from "moment";

// const fileTypes = ["JPG", "PNG", "GIF"];
import "./upload.style.css";
import CustomSelect from "../../../components/CustomSelect";
import useUploads from "./useUploads";

export default function Uploads() {
  const {
    collections,
    values,
    handleChange,
    handleFileChange,
    onSubmit,
    files,
    uploadedFiles,
    showUploadView,
    setShowUploadView,
  } = useUploads();

  const formatFileSize = (bytes) => {
    if (!bytes) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return moment(dateString).format("DD MMM YYYY, HH:mm");
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      processed: "bg-green-100 text-green-800",
      processing: "bg-yellow-100 text-yellow-800",
      failed: "bg-red-100 text-red-800",
      pending: "bg-gray-100 text-gray-800",
    };
    const colorClass =
      statusColors[status?.toLowerCase()] || statusColors.pending;
    return (
      <span
        className={`px-2 py-1 text-xs font-semibold rounded-full ${colorClass}`}
      >
        {status?.toUpperCase() || "PENDING"}
      </span>
    );
  };

  // List View (Default)
  if (!showUploadView) {
    return (
      <div className="">
        <BlankCard
          header={
            <div className="flex flex-1">
              <div className="flex-1">
                <h4 className="box-title font-bold text-base">
                  UPLOADED FILES
                </h4>
              </div>
            </div>
          }
        >
          <div className="flex flex-1 justify-end items-center">
            <div>
              <PrimaryButton
                label="UPLOAD"
                onClick={() => setShowUploadView(true)}
              />
            </div>
          </div>
          <div className="pt-3 w-full">
            <div
              className="relative overflow-x-auto mt-2 mb-2 custom-table-style"
              style={{ maxHeight: "70vh", overflowY: "auto" }}
            >
              {uploadedFiles.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No uploaded files found
                </div>
              ) : (
                <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400 sticky top-0">
                    <tr>
                      <th scope="col" className="px-6 py-3">
                        Filename
                      </th>
                      <th scope="col" className="px-6 py-3">
                        Datasource
                      </th>
                      <th scope="col" className="px-6 py-3">
                        File Size
                      </th>
                      <th scope="col" className="px-6 py-3">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3">
                        Uploaded At
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {uploadedFiles.map((file, index) => (
                      <tr
                        key={file._id || index}
                        className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                      >
                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                          {file.filename || "-"}
                        </td>
                        <td className="px-6 py-4">{file.datasource || "-"}</td>
                        <td className="px-6 py-4">
                          {formatFileSize(file.file_size)}
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(file.status)}
                        </td>
                        <td className="px-6 py-4">
                          {formatDate(file.uploaded_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </BlankCard>
      </div>
    );
  }

  // Upload View
  return (
    <div className="">
      <BlankCard
        header={
          <div className="flex justify-between items-center">
            <h4 className="box-title font-bold text-base">UPLOAD</h4>
          </div>
        }
      >
        <div className="flex flex-1 justify-end items-center">
          <div>
            <PrimaryButton
              label="SEE LIST"
              onClick={() => setShowUploadView(false)}
            />
          </div>
        </div>
        <div className="pt-3 w-full">
          <div className="md:w-1/3 mb-3">
            <CustomSelect
              label="Collection"
              data={[
                { collection: "-Select Collection-" },
                ...collections.map((col) => ({
                  collection:
                    typeof col === "string" ? col : col?.collection || col,
                })),
              ]}
              option_value={"collection"}
              option_label={"collection"}
              onChange={(e) => handleChange("collection", e.target.value)}
              value={values?.collection}
              required
            />
          </div>
          <div className="custom-file-picker">
            <FileUploader
              handleChange={handleFileChange}
              name="file"
              // types={fileTypes}
              multiple
            >
              <div className="drag-drop-component">
                <i
                  className="fas fa-file-alt"
                  style={{ fontSize: "30px", marginBottom: "15px" }}
                ></i>
                <p>Drag & Drop your files here</p>
              </div>
            </FileUploader>
            <div className="flex gap-2">
              {[...files]?.map((file, index) => {
                return (
                  <div key={index} className="added-file-list">
                    <p>{file?.name}</p>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="md:w-1/3 mt-3">
            <PrimaryButton label="Upload" onClick={onSubmit} />
          </div>
        </div>
      </BlankCard>
    </div>
  );
}
