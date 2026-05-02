import apiClient from "./client";

export const fetchPermissionRoles = async () => {
  try {
    const response = await apiClient.get('/permission-roles');
    return response.data;
  } catch (error) {
    console.error('Error fetching permission roles:', error);
    throw error;
  }
};

export const getPermissionRoleById = async (permissionId, roleId) => {
  try {
    const response = await apiClient.get(`/permission-roles/${permissionId}/${roleId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching permission role:', error);
    throw error;
  }
};

export const addPermissionRole = async (permissionRole) => {
  try {
    const response = await apiClient.post('/permission-roles', permissionRole);
    return response.data;
  } catch (error) {
    console.error('Error adding permission role:', error);
    throw error;
  }
};

export const updatePermissionRole = async (permissionId, roleId, permissionRole) => {
  try {
    const response = await apiClient.put(`/permission-roles/${permissionId}/${roleId}`, permissionRole);
    return response.data;
  } catch (error) {
    console.error('Error updating permission role:', error);
    throw error;
  }
};

export const deletePermissionRole = async (permissionId, roleId) => {
  try {
    const response = await apiClient.delete(`/permission-roles/${permissionId}/${roleId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting permission role:', error);
    throw error;
  }
};
