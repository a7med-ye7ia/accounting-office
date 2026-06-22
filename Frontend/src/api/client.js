import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://10.134.242.225:8080/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Automatically attach the auth token to every request
// ! This is commented out for now since we don't have authentication implemented yet. 
// ! Once we do, we can uncomment this to ensure all requests include the token.
// apiClient.interceptors.request.use((config) => {
//   const token = localStorage.getItem('token');
//   if (token) {
//     config.headers.Authorization = `Bearer ${token}`;
//   }
//   return config;
// });

export default apiClient;