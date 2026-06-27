import apiClient from "./client";

export const fetchCompanies = async () => {
  try {
    const response = await apiClient.get('/companies');
    return response.data;
  } catch (error) {
    console.error('Error fetching companies:', error);
    throw error;
  }
};

export const fetchCompanyById = async (companyId) => {
  try {
    const response = await apiClient.get(`/companies/${companyId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching company:', error);
    throw error;
  }
};

// export const fetchCompanyFileTree = async (companyId) => {
//   try {
//     const response = await apiClient.get(`/files/company/${companyId}/tree`);
//     return response.data;
//   } catch (error) {
//     console.error('Error fetching company file tree:', error);
//     throw error;
//   }
// };
// 
// export const getCompanyFileDownloadUrl = (companyId, relativePath) => {
//   const encodedPath = encodeURIComponent(relativePath);
//   return `${API_BASE_URL}/files/company/${companyId}/download?path=${encodedPath}`;
// }
// 

/**
 * Upload a PDF file to the OCR endpoint for text extraction.
 * Currently uses a fake OCR API that returns predefined data.
 * When the real OCR is ready, only the backend endpoint implementation changes.
 */
export const uploadPdfForOcr = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post('/ocr/extract', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  } catch (error) {
    console.error('Error uploading PDF for OCR:', error);
    throw error;
  }
};

/**
 * Create a company with an establishment contract using OCR-extracted data.
 * The OCR JSON is stored as-is in the contract's ocrData field.
 */
export const createCompanyFromOcr = async (
  companyData,
  pdfFile,
  ocrData
) => {
  const formData = new FormData();

  // CreateCompanyRequest
  formData.append(
    "company",
    new Blob(
      [JSON.stringify(companyData)],
      { type: "application/json" }
    )
  );

  // PDF
  formData.append("pdf", pdfFile);

  // OCR JSON (saved as file later)
  formData.append(
    "ocrJson",
    JSON.stringify(ocrData, null, 2)
  );

  console.log("FormData contents:");
  for (let pair of formData.entries()) {
    console.log(pair[0] + ': ' + pair[1]);
  }

  const response = await apiClient.post(
    "/companies/with-contract",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
};
