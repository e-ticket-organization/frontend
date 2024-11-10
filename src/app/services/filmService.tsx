import axios from 'axios';
import { IPerfomance } from '@/app/types/perfomance';
import { IShow } from '@/app/types/show';
import { IProducer } from '@/app/types/producer';
import { refreshToken } from './authService';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const api = axios.create({
    baseURL: API_URL,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    withCredentials: true, 
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

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
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);

export const getPerfomances = async (): Promise<IPerfomance[]> => {
    const response = await api.get<IPerfomance[]>('/performances');
    return response.data;
};

export const getProducers = async (): Promise<IProducer[]> => {
    const response = await api.get<IProducer[]>('/producers');
    return response.data;
};

interface IPerformanceCreate {
    title: string;
    duration: number;
    image: string;
    producer: number;
}

export const addPerfomance = async (performanceData: IPerformanceCreate): Promise<IPerfomance> => {
    try {
        console.log('Дані для відправки:', performanceData);
        const response = await api.post<IPerfomance>('/performances', {
            title: performanceData.title,
            duration: performanceData.duration,
            producer: performanceData.producer, 
            image: performanceData.image
        });
        return response.data;
    } catch (error: any) {
        console.error('Response error:', error.response?.data);
        if (error.response?.data?.message) {
            throw new Error(error.response.data.message);
        }
        throw new Error('Помилка при додаванні вистави');
    }
};

export const getActors = async () => {
    const response = await api.get('/actors');
    return response.data;
};

export const getUsers = async () => {
    const response = await api.get('/users');
    return response.data;
};
