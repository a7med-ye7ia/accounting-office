import apiClient from "./client";

export const fetchContracts = async () => {
  try {
    const response = await apiClient.get('/contracts');
    return response.data;
  } catch (error) {
    console.error('Error fetching contracts:', error);
    throw error;
  }
};

export const getContractById = async (id) => {
  try {
    const response = await apiClient.get(`/contracts/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching contract:', error);
    throw error;
  }
};

export const addContract = async (contract) => {
  try {
    const response = await apiClient.post('/contracts', contract);
    return response.data;
  } catch (error) {
    console.error('Error adding contract:', error);
    throw error;
  }
};

export const updateContract = async (id, contract) => {
  try {
    const response = await apiClient.put(`/contracts/${id}`, contract);
    return response.data;
  } catch (error) {
    console.error('Error updating contract:', error);
    throw error;
  }
};

export const deleteContract = async (id) => {
  try {
    const response = await apiClient.delete(`/contracts/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting contract:', error);
    throw error;
  }
};
