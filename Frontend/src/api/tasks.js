import apiClient from "./client";

export const fetchTasks = async () => {
  try {
    const response = await apiClient.get('/tasks');
    return response.data;
  } catch (error) {
    console.error('Error fetching tasks:', error);
    throw error;
  }
};

export const addTask = async (task) => {
  try {
    const response = await apiClient.post('/tasks', task);
    return response.data;
  } catch (error) {
    console.error('Error adding task:', error);
    throw error;
  }
};

export const deleteTask = async (id) => {
  try {
    const response = await apiClient.delete(`/tasks/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting task:', error);
    throw error;
  }
};

export const updateTask = async (id, newTask) => {
  try {
    const response = await apiClient.put(`/tasks/${id}`, newTask);
    return response.data;
  } catch (error) {
    console.error('Error updating task: ', error);
    throw error;
  }
};

export const getTaskByAssignedToId = async (userId) => {
  try {
    const response = await apiClient.get(`/tasks/assignedTo/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching tasks by user ID:', error);
    throw error;
  }
};

export const getTaskByCreatedById = async (userId) => {
  try {
    const response = await apiClient.get(`/tasks/createdBy/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching tasks by creator ID:', error);
    throw error;
  }
};