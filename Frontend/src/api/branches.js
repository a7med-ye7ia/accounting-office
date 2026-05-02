import apiClient from "./client";

export const fetchBranches = async () => {
  try {
    const response = await apiClient.get('/branches');
    return response.data;
  } catch (error) {
    console.error('Error fetching branches:', error);
    throw error;
  }
};

export const getBranchById = async (id) => {
  try {
    const response = await apiClient.get(`/branches/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching branch:', error);
    throw error;
  }
};

export const addBranch = async (branch) => {
  try {
    const response = await apiClient.post('/branches', branch);
    return response.data;
  } catch (error) {
    console.error('Error adding branch:', error);
    throw error;
  }
};

export const updateBranch = async (id, branch) => {
  try {
    const response = await apiClient.put(`/branches/${id}`, branch);
    return response.data;
  } catch (error) {
    console.error('Error updating branch:', error);
    throw error;
  }
};

export const deleteBranch = async (id) => {
  try {
    const response = await apiClient.delete(`/branches/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting branch:', error);
    throw error;
  }
};
