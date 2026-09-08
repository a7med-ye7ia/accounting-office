import apiClient from "./client";

export const fetchUsers = async (params = {}) => {
  try {
    let url = '/users';
    const query = new URLSearchParams();
    if (params.branchId) query.append('branchId', params.branchId);
    if (params.departmentId) query.append('departmentId', params.departmentId);
    const qs = query.toString();
    if (qs) {
      url += `?${qs}`;
    }
    const response = await apiClient.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

export const getUserById = async (id) => {
  try {
    const response = await apiClient.get(`/users/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching user:', error);
    throw error;
  }
};

/** Comprehensive profile: native SQL aggregation on the backend (tasks, contracts, joins). */
export const getEmployeeProfile = async (id) => {
  try {
    const response = await apiClient.get(`/users/${id}/profile`);
    return response.data;
  } catch (error) {
    console.error('Error fetching employee profile:', error);
    throw error;
  }
};

export const addUser = async (user) => {
  try {
    const response = await apiClient.post('/users', user);
    return response.data;
  } catch (error) {
    console.error('Error adding user:', error);
    throw error;
  }
};

export const updateUser = async (id, user) => {
  try {
    const response = await apiClient.put(`/users/${id}`, user);
    return response.data;
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

export const deleteUser = async (id) => {
  try {
    const response = await apiClient.delete(`/users/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};