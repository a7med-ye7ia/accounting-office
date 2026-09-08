import apiClient from './client';

export const fetchTaskAttachments = async (taskId) => {
  const response = await apiClient.get(`/tasks/${taskId}/attachments`);
  return response.data;
};

export const uploadTaskAttachments = async (taskId, files, onUploadProgress) => {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append('files', file, file.name || 'attachment.jpg');
  });

  const response = await apiClient.post(`/tasks/${taskId}/attachments`, formData, {
    onUploadProgress,
  });
  return response.data;
};

export const fetchAttachmentBlob = async (attachmentId) => {
  const response = await apiClient.get(`/attachments/${attachmentId}`, {
    responseType: 'blob',
  });
  return response.data;
};

export const deleteAttachment = async (attachmentId) => {
  await apiClient.delete(`/attachments/${attachmentId}`);
};
