// api/files.js

import apiClient from "./client";

export const uploadFile = async (file) => {
  const formData = new FormData();

  formData.append("file", file);

  const response = await apiClient.post(
    "/files/upload",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
};

export const uploadFileToCompanyFolder = async (file, companyFolderName) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("companyFolder", companyFolderName);

  const response = await apiClient.post(
    "/files/uploadToCompanyFolder",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
};

export const uploadOtherContractFile = async (file, companyFolderName, companyId, relativePath = "") => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("companyFolder", companyFolderName);
  formData.append("companyId", companyId);
  formData.append("relativePath", relativePath);

  const response = await apiClient.post(
    "/files/uploadOtherContract",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
};

export const createOtherContractFolder = async (companyFolderName, folderName, relativePath = "") => {
  const response = await apiClient.post("/files/createOtherSubfolder", null, {
    params: {
      companyFolder: companyFolderName,
      folderName,
      relativePath,
    },
  });

  return response.data;
};