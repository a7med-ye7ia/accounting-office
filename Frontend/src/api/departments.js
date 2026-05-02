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
    const response = await apiClient.get('/departments');
    const departmentNames = response.data.map(department => department.name);
    return departmentNames;
  } catch (error) {
    console.error('Error fetching department names:', error);
    throw error;
  }
};