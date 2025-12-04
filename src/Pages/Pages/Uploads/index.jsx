import React, { useEffect, useRef, useState } from "react";
import BlankCard from "../../../components/BlankCard";
import PrimaryButton from "../../../components/PrimaryButton";

import { FileUploader } from "react-drag-drop-files";

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
  } = useUploads();

  return (
    <div className="">
      <BlankCard
        header={<h4 className="box-title font-bold text-base">UPLOAD</h4>}
      >
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
