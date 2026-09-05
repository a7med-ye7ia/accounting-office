import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  // ! removed because there was a problem when sending 
  // ! the request to save the updating json file
  
  // headers: {
  //   'Content-Type': 'application/json',
  // },
});

// Automatically attach the auth token to every request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Automatically handle unauthorized responses (expired/invalid token)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      const currentPath = window.location.pathname;
      if (currentPath !== '/' && currentPath !== '/login') {
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
