import apiClient from "./client";

export const fetchDepartments = async () => {
  try {
    const response = await apiClient.get('/departments');
    return response.data;
  } catch (error) {
    console.error('Error fetching departments:', error);
    throw error;
  }
};

export const getDepartmentNames = async () => {
  try {
    const response = await apiClient.get('/departments/names');
    return response.data;
  } catch (error) {
    console.error('Error fetching department names:', error);
    throw error;
  }
};