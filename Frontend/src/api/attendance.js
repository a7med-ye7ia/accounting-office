import apiClient from './client';

export const getMyToday = async () => {
  const res = await apiClient.get('/attendance/today/me');
  return res.data;
};

export const startAttendance = async (payload) => {
  const res = await apiClient.post('/attendance/start', payload);
  return res.data;
};

export const endAttendance = async (payload) => {
  const res = await apiClient.post('/attendance/end', payload);
  return res.data;
};

export const getToday = async () => {
  const res = await apiClient.get('/attendance/today');
  return res.data;
};

export const getEmployeeHistory = async (employeeId) => {
  const res = await apiClient.get(`/attendance/employee/${employeeId}`);
  return res.data;
};

export const getMyHistory = async () => {
  const res = await apiClient.get('/attendance/employee/me');
  return res.data;
};

export default {
  getMyToday,
  startAttendance,
  endAttendance,
  getToday,
  getEmployeeHistory,
  getMyHistory,
};
