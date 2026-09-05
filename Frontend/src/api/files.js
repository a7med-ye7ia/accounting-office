// api/files.js

import apiClient from "./client";

// export const uploadFile = async (file) => {
//   const formData = new FormData();

//   formData.append("file", file);

//   const response = await apiClient.post(
//     "/files/upload",
//     formData,
//     {
//       headers: {
//         "Content-Type": "multipart/form-data",
//       },
//     }
//   );

//   return response.data;
// };

export const uploadFileToCompanyFolder = async (file, companyFolderName) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("companyFolder", companyFolderName);
console.log("file =", file);
console.log("companyFolder =", companyFolderName);

for (const [key, value] of formData.entries()) {
  console.log(key, value);
}

  const response = await apiClient.post(
    `/files/uploadToCompanyFolder`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
};

export const getFileFromPath = async (filePath) => {
  const response = await apiClient.get("/files/pdf", {
    params: {
      path: filePath,
    },
    responseType: "blob",
  });

  return response.data;
};