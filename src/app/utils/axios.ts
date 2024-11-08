import axios from 'axios';
import { getToken } from '@/app/services/authService';

const api = axios.create({
  baseURL: '',
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token && config.headers) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;