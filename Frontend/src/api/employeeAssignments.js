import apiClient from "./client";

export const fetchEmployeeAssignments = async () => {
  try {
    const response = await apiClient.get('/employee-assignments');
    return response.data;
  } catch (error) {
    console.error('Error fetching employee assignments:', error);
    throw error;
  }
};

export const getEmployeeAssignmentById = async (id) => {
  try {
    const response = await apiClient.get(`/employee-assignments/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching employee assignment:', error);
    throw error;
  }
};

export const addEmployeeAssignment = async (assignment) => {
  try {
    const response = await apiClient.post('/employee-assignments', assignment);
    return response.data;
  } catch (error) {
    console.error('Error adding employee assignment:', error);
    throw error;
  }
};

export const updateEmployeeAssignment = async (id, assignment) => {
  try {
    const response = await apiClient.put(`/employee-assignments/${id}`, assignment);
    return response.data;
  } catch (error) {
    console.error('Error updating employee assignment:', error);
    throw error;
  }
};

export const deleteEmployeeAssignment = async (id) => {
  try {
    const response = await apiClient.delete(`/employee-assignments/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting employee assignment:', error);
    throw error;
  }
};
