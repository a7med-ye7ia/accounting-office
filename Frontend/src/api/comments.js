import apiClient from "./client";

export const fetchCommentsByTaskId = async (taskId) => {
  try {
    const response = await apiClient.get(`/comments/${taskId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching comments:', error);
    throw error;
  }
};

export const addCommentToTask = async (comment) => {
  try {
    const response = await apiClient.post(`/comments`, comment);
    return response.data;
  } catch (error) {
    console.error('Error adding comment:', error);
    throw error;
  }
};

export const deleteComment = async (commentId) => {
  try {
    const response = await apiClient.delete(`/comments/${commentId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting comment:', error);
    throw error;
  }
};

// export const updateComment = async (commentId, newComment) => {
//   try {
//     const response = await apiClient.put(`/comments/${commentId}`, newComment);
//     return response.data;
//   } catch (error) {
//     console.error('Error updating comment: ', error);
//     throw error;
//   }
// };