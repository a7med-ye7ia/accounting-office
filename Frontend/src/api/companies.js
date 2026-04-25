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