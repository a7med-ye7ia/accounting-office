import axios from "axios";
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

/**
 * Upload a PDF file to the OCR endpoint for text extraction.
 * Currently uses a fake OCR API that returns predefined data.
 * When the real OCR is ready, only the backend endpoint implementation changes.
 */
export const uploadPdfForOcr = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axios.post('http://localhost:8080/api/ocr/extract', formData, {
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