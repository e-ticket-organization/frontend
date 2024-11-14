import axios from 'axios';
import { LoginCredentials, RegisterCredentials, User } from '@/app/types/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const AUTH_URL = process.env.NEXT_PUBLIC_AUTH_URL;

interface LoginResponse {
  token: string;
  user: User;
}

interface RefreshResponse {
  token: string;
}

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true, 
});

const api_auth = axios.create({
  baseURL: AUTH_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const login = async (credentials: LoginCredentials): Promise<LoginResponse> => {
  try {
    const response = await api_auth.post('login', credentials);
    const { token, user } = response.data;
    
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || 'Помилка авторизації');
    }
    throw error;
  }
};

export const admin_login = async (credentials: LoginCredentials): Promise<LoginResponse> => {
  try {
    const response = await api_auth.post('admin/login', credentials);
    const { token, user } = response.data;
    
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || 'Помилка авторизації');
    }
    throw error;
  }
};

export const register = async (credentials: RegisterCredentials): Promise<LoginResponse> => {
  try {
    const response = await api_auth.post('register', credentials);
    const { token, user } = response.data;
    
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || 'Помилка реєстрації');
    }
    throw error;
  }
};

export const logout = async (): Promise<void> => {
  try {
    await api_auth.post('logout');
  } finally {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};

export const getToken = (): string | null => {
  return localStorage.getItem('token');
};

export const getUser = (): User | null => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

export const fetchUserProfile = async (): Promise<User> => {
  try {
    const response = await api.get('user');
    const user = response.data;
    localStorage.setItem('user', JSON.stringify(user));
    return user;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || 'Помилка отримання профілю');
    }
    throw error;
  }
};

export const refreshToken = async (): Promise<string> => {
  try {
    const response = await api_auth.post<RefreshResponse>('refresh');
    const { token } = response.data;
    localStorage.setItem('token', token);
    return token;
  } catch (error) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    throw error;
  }
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const token = await refreshToken();
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

api_auth.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const token = await refreshToken();
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api_auth(originalRequest);
      } catch (refreshError) {
        const user = getUser();
        if (user?.status === 'admin') {
          window.location.href = '/admin/login';
        } else {
          window.location.href = '/';
        }
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);