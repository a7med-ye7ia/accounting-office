import apiClient from "./client";

export const fetchReports = async () => {
  try {
    const response = await apiClient.get('/reporting');
    return response.data;
  } catch (error) {
    console.error('Error fetching reports:', error);
    throw error;
  }
};

export const getReportById = async (id) => {
  try {
    const response = await apiClient.get(`/reporting/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching report:', error);
    throw error;
  }
};

export const addReport = async (report) => {
  try {
    const response = await apiClient.post('/reporting', report);
    return response.data;
  } catch (error) {
    console.error('Error adding report:', error);
    throw error;
  }
};

export const updateReport = async (id, report) => {
  try {
    const response = await apiClient.put(`/reporting/${id}`, report);
    return response.data;
  } catch (error) {
    console.error('Error updating report:', error);
    throw error;
  }
};

export const deleteReport = async (id) => {
  try {
    const response = await apiClient.delete(`/reporting/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting report:', error);
    throw error;
  }
};
