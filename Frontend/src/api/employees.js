import apiClient from "./client";

export const fetchEmployees = async () => {
  try {
    const response = await apiClient.get('/employees');
    return response.data;
  } catch (error) {
    console.error('Error fetching employees:', error);
    throw error;
  }
};

export const addEmployee = async (employee) => {
  try {
    if (!employee.name?.trim() || !employee.email?.trim()) {
      throw new Error('Id and Name and email are required');
    }
    
    const response = await apiClient.post('/employees', employee);
    return response.data;
  } catch (error) {
    console.error('Error adding employee:', error);
    if (error.response?.data) {
      console.error('Backend error details:', error.response.data);
    }
    throw error;
  }
};

export const deleteEmployee = async (id) => {
  try {
    const response = await apiClient.delete(`/employees/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting employee:', error);
    if (error.response?.data) {
      console.error('Backend error details:', error.response.data);
    }
    throw error;
  }
};