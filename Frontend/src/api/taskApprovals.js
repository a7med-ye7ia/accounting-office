import apiClient from "./client";

export const fetchTaskApprovals = async () => {
  try {
    const response = await apiClient.get('/task-approvals');
    return response.data;
  } catch (error) {
    console.error('Error fetching task approvals:', error);
    throw error;
  }
};

export const getTaskApprovalById = async (id) => {
  try {
    const response = await apiClient.get(`/task-approvals/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching task approval:', error);
    throw error;
  }
};

export const addTaskApproval = async (approval) => {
  try {
    const response = await apiClient.post('/task-approvals', approval);
    return response.data;
  } catch (error) {
    console.error('Error adding task approval:', error);
    throw error;
  }
};

export const updateTaskApproval = async (id, approval) => {
  try {
    const response = await apiClient.put(`/task-approvals/${id}`, approval);
    return response.data;
  } catch (error) {
    console.error('Error updating task approval:', error);
    throw error;
  }
};

export const deleteTaskApproval = async (id) => {
  try {
    const response = await apiClient.delete(`/task-approvals/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting task approval:', error);
    throw error;
  }
};
