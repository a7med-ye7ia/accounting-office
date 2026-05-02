import apiClient from "./client";

export const fetchUserRoles = async () => {
  try {
    const response = await apiClient.get('/user-roles');
    return response.data;
  } catch (error) {
    console.error('Error fetching user roles:', error);
    throw error;
  }
};

export const getUserRoleById = async (userId, roleId) => {
  try {
    const response = await apiClient.get(`/user-roles/${userId}/${roleId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching user role:', error);
    throw error;
  }
};

export const addUserRole = async (userRole) => {
  try {
    const response = await apiClient.post('/user-roles', userRole);
    return response.data;
  } catch (error) {
    console.error('Error adding user role:', error);
    throw error;
  }
};

export const updateUserRole = async (userId, roleId, userRole) => {
  try {
    const response = await apiClient.put(`/user-roles/${userId}/${roleId}`, userRole);
    return response.data;
  } catch (error) {
    console.error('Error updating user role:', error);
    throw error;
  }
};

export const deleteUserRole = async (userId, roleId) => {
  try {
    const response = await apiClient.delete(`/user-roles/${userId}/${roleId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting user role:', error);
    throw error;
  }
};
