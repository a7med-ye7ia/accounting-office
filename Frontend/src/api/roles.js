import apiClient from "./client";

export const fetchRoles = async () => {
  try {
    const response = await apiClient.get('/roles');
    return response.data;
  } catch (error) {
    console.error('Error fetching roles:', error);
    throw error;
  }
};

export const getRoleById = async (id) => {
  try {
    const response = await apiClient.get(`/roles/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching role:', error);
    throw error;
  }
};

export const addRole = async (role) => {
  try {
    const response = await apiClient.post('/roles', role);
    return response.data;
  } catch (error) {
    console.error('Error adding role:', error);
    throw error;
  }
};

export const updateRole = async (id, role) => {
  try {
    const response = await apiClient.put(`/roles/${id}`, role);
    return response.data;
  } catch (error) {
    console.error('Error updating role:', error);
    throw error;
  }
};

export const deleteRole = async (id) => {
  try {
    const response = await apiClient.delete(`/roles/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting role:', error);
    throw error;
  }
};
