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
    throw new Error(apiError(error, 'تعذر إضافة المهمة'));
  }
};

export const deleteTask = async (id) => {
  try {
    const response = await apiClient.delete(`/tasks/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting task:', error);
    throw new Error(apiError(error, 'تعذر حذف المهمة'));
  }
};

export const updateTask = async (id, newTask) => {
  try {
    const response = await apiClient.put(`/tasks/${id}`, newTask);
    return response.data;
  } catch (error) {
    console.error('Error updating task: ', error);
    throw new Error(apiError(error, 'تعذر تحديث المهمة'));
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

const apiError = (error, fallback) =>
  error?.response?.data?.error || error?.response?.data?.message || error?.message || fallback;

export const addSubTask = async (taskId, subtask) => {
  try {
    const response = await apiClient.post(`/tasks/${taskId}/subtasks`, subtask);
    return response.data;
  } catch (error) {
    console.error('Error adding subtask:', error);
    throw new Error(apiError(error, 'تعذر إضافة المهمة الفرعية'));
  }
};

export const updateSubTask = async (taskId, subTaskId, subtask) => {
  try {
    const response = await apiClient.put(`/tasks/${taskId}/subtasks/${subTaskId}`, subtask);
    return response.data;
  } catch (error) {
    console.error('Error updating subtask:', error);
    throw new Error(apiError(error, 'تعذر تحديث المهمة الفرعية'));
  }
};

export const deleteSubTask = async (taskId, subTaskId) => {
  try {
    const response = await apiClient.delete(`/tasks/${taskId}/subtasks/${subTaskId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting subtask:', error);
    throw new Error(apiError(error, 'تعذر حذف المهمة الفرعية'));
  }
};

export const startSubTask = async (taskId, subTaskId) => {
  try {
    const response = await apiClient.post(`/tasks/${taskId}/subtasks/${subTaskId}/start`);
    return response.data;
  } catch (error) {
    console.error('Error starting subtask:', error);
    throw new Error(apiError(error, 'تعذر بدء المهمة الفرعية'));
  }
};

export const completeSubTask = async (taskId, subTaskId) => {
  try {
    const response = await apiClient.post(`/tasks/${taskId}/subtasks/${subTaskId}/complete`);
    return response.data;
  } catch (error) {
    console.error('Error completing subtask:', error);
    throw new Error(apiError(error, 'تعذر إنهاء المهمة الفرعية'));
  }
};

export const claimTask = async (taskId) => {
  try {
    const response = await apiClient.post(`/tasks/${taskId}/claim`);
    return response.data;
  } catch (error) {
    console.error('Error claiming task:', error);
    throw new Error(apiError(error, 'تعذر استلام المهمة'));
  }
};

export const claimSubTask = async (taskId, subTaskId) => {
  try {
    const response = await apiClient.post(`/tasks/${taskId}/subtasks/${subTaskId}/claim`);
    return response.data;
  } catch (error) {
    console.error('Error claiming subtask:', error);
    throw new Error(apiError(error, 'تعذر استلام المهمة الفرعية'));
  }
};

export const leaveTask = async (taskId) => {
  try {
    const response = await apiClient.post(`/tasks/${taskId}/leave`);
    return response.data;
  } catch (error) {
    console.error('Error leaving task:', error);
    throw new Error(apiError(error, 'تعذر مغادرة المهمة'));
  }
};

// ---- Manager review workflow (/review/:taskId) ----

export const getTaskReview = async (taskId) => {
  try {
    const response = await apiClient.get(`/tasks/${taskId}/review`);
    return response.data;
  } catch (error) {
    console.error('Error fetching task review:', error);
    throw error;
  }
};

export const approveTaskReview = async (taskId) => {
  try {
    const response = await apiClient.post(`/tasks/${taskId}/approve`);
    return response.data;
  } catch (error) {
    console.error('Error approving task:', error);
    throw new Error(apiError(error, 'تعذر قبول المهمة'));
  }
};

export const returnTaskReview = async (taskId) => {
  try {
    const response = await apiClient.post(`/tasks/${taskId}/return`);
    return response.data;
  } catch (error) {
    console.error('Error returning task:', error);
    throw new Error(apiError(error, 'تعذر إعادة المهمة للتعديل'));
  }
};
