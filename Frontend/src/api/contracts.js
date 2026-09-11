import apiClient from "./client";

export const fetchContracts = async () => {
  try {
    const response = await apiClient.get("/contracts");
    return response.data;
  } catch (error) {
    console.error("Error fetching contracts:", error);
    throw error;
  }
};

export const getContractById = async (id) => {
  try {
    const response = await apiClient.get(`/contracts/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching contract:", error);
    throw error;
  }
};

export const getCreatingContractByCompanyId = async (companyId) => {
  try {
    const response = await apiClient.get(`/contracts/creating/${companyId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching creating contract:", error);
    throw error;
  }
};

export const getUpdatingContractByCompanyId = async (companyId) => {
  try {
    const response = await apiClient.get(`/contracts/updating/${companyId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching updating contract:", error);
    throw error;
  }
};


export const addContract = async (contract) => {
  try {
    const response = await apiClient.post("/contracts", contract);
    return response.data;
  } catch (error) {
    console.error("Error adding contract:", error);
    throw error;
  }
};

export const uploadContract = async ({ companyId, type, file }) => {
  const formData = new FormData();
  formData.append("companyId", companyId);
  formData.append("type", type);
  if (type === "UPDATING") {
    let fileName = file.title;
    for (const mod of file.modifications) {
      fileName += `_${Number(mod.articleId) + 1}`;
    }
    const jsonBlob = new Blob(
      [JSON.stringify(file, null, 2)],
      { type: "application/json" }
    );
    formData.append("file", jsonBlob, `${fileName}.json`);
    console.log("fileName =", fileName);
  } else {
    formData.append("file", file);
  }


  try {
    const response = await apiClient.post("/contracts/upload", formData
      // , {headers: { "Content-Type": "multipart/form-data" },}
    );
    return response.data;
  } catch (error) {
    console.error("Error uploading contract:", error);
    throw error;
  }
};

export const updateContract = async (id, contract) => {
  try {
    const response = await apiClient.put(`/contracts/${id}`, contract);
    return response.data;
  } catch (error) {
    console.error("Error updating contract:", error);
    throw error;
  }
};

export const deleteContract = async (id) => {
  try {
    const response = await apiClient.delete(`/contracts/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting contract:", error);
    throw error;
  }
};
