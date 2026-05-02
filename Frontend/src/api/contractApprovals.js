import apiClient from "./client";

export const fetchContractApprovals = async () => {
  try {
    const response = await apiClient.get('/contract-approvals');
    return response.data;
  } catch (error) {
    console.error('Error fetching contract approvals:', error);
    throw error;
  }
};

export const getContractApprovalById = async (id) => {
  try {
    const response = await apiClient.get(`/contract-approvals/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching contract approval:', error);
    throw error;
  }
};

export const addContractApproval = async (approval) => {
  try {
    const response = await apiClient.post('/contract-approvals', approval);
    return response.data;
  } catch (error) {
    console.error('Error adding contract approval:', error);
    throw error;
  }
};

export const updateContractApproval = async (id, approval) => {
  try {
    const response = await apiClient.put(`/contract-approvals/${id}`, approval);
    return response.data;
  } catch (error) {
    console.error('Error updating contract approval:', error);
    throw error;
  }
};

export const deleteContractApproval = async (id) => {
  try {
    const response = await apiClient.delete(`/contract-approvals/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting contract approval:', error);
    throw error;
  }
};
