import apiClient from "./client";

export const fetchPermissions = async () => {
  try {
    const response = await apiClient.get('/permissions');
    return response.data;
  } catch (error) {
    console.error('Error fetching permissions:', error);
    throw error;
  }
};

export const getPermissionById = async (id) => {
  try {
    const response = await apiClient.get(`/permissions/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching permission:', error);
    throw error;
  }
};

export const addPermission = async (permission) => {
  try {
    const response = await apiClient.post('/permissions', permission);
    return response.data;
  } catch (error) {
    console.error('Error adding permission:', error);
    throw error;
  }
};

export const updatePermission = async (id, permission) => {
  try {
    const response = await apiClient.put(`/permissions/${id}`, permission);
    return response.data;
  } catch (error) {
    console.error('Error updating permission:', error);
    throw error;
  }
};

export const deletePermission = async (id) => {
  try {
    const response = await apiClient.delete(`/permissions/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting permission:', error);
    throw error;
  }
};
