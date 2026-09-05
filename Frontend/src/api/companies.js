import apiClient from "./client";

export const fetchCompanies = async () => {
  try {
    const response = await apiClient.get("/companies");
    return response.data;
  } catch (error) {
    console.error("Error fetching companies:", error);
    throw error;
  }
};

export const uploadPdfForOcr = async (file) => {
  try {
    const fileId = crypto.randomUUID();
    const formData = new FormData();
    formData.append("file", file);
    formData.append("fileId", fileId);

    const response = await apiClient.post("/ocr/extract2", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    // const response = await apiClient.post("/ocr/extract", formData, {
    //   headers: { "Content-Type": "multipart/form-data" },
    // });

    return {
      ...response.data,
      fileId,
    };
  } catch (error) {
    console.error("Error uploading PDF for OCR:", error);
    throw error;
  }
};

export const createCompanyFromOcr = async (companyData, pdfFile, ocrData) => {
  const formData = new FormData();

  formData.append(
    "company",
    new Blob([JSON.stringify(companyData)], { type: "application/json" })
  );
  formData.append("pdf", pdfFile);
  formData.append("ocrJson", JSON.stringify(ocrData, null, 2));

  const response = await apiClient.post("/companies/with-contract", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return response.data;
};

export const getCompanyById = async (id) => {
  try {
    const response = await apiClient.get(`/companies/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching company:", error);
    throw error;
  }
};

export const createCompany = async (company) => {
  try {
    const response = await apiClient.post("/companies", company);
    return response.data;
  } catch (error) {
    console.error("Error creating company:", error);
    throw error;
  }
};

export const updateCompany = async (id, company) => {
  try {
    const response = await apiClient.put(`/companies/${id}`, company);
    return response.data;
  } catch (error) {
    console.error("Error updating company:", error);
    throw error;
  }
};

export const deleteCompany = async (id) => {
  try {
    const response = await apiClient.delete(`/companies/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting company:", error);
    throw error;
  }
};
