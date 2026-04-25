import apiClient from "./client";

export const fetchLedger = async () => {
  try {
    const response = await apiClient.get('/ledger');
    return response.data;
  } catch (error) {
    console.error('Error fetching ledger:', error);
    throw error;
  }
};
