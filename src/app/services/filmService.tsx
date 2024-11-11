import axios from 'axios';
import { IPerfomance } from '@/app/types/perfomance';
import { IShow } from '@/app/types/show';
import { IProducer } from '@/app/types/producer';
import { IHall } from '@/app/types/hall';
import { refreshToken } from './authService';
import { IUser } from '../types/user';
import { IActor } from '../types/actor';
import { IGenre } from '../types/genre';
import { ISeat } from '../types/seat';
import { ITicket } from '../types/ticket';

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const WS_URL = process.env.NEXT_PUBLIC_WS_URL;

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
        if (error.response?.status === 401) {
            try {
                await refreshToken();
                // Повторюємо оригінальний запит з новим токеном
                const token = localStorage.getItem('token');
                error.config.headers.Authorization = `Bearer ${token}`;
                return api.request(error.config);
            } catch (refreshError) {
                console.error('Помилка оновлення токена:', refreshError);
                // Можливо, тут варто перенаправити на сторінку входу
                window.location.href = '/login';
            }
        }
        console.error('API помилка:', error);
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
    genre_id: number;
}


export const addPerfomance = async (performanceData: IPerformanceCreate): Promise<IPerfomance> => {
    try {
        console.log('Дані для відправки:', performanceData);
        const response = await api.post<IPerfomance>('/performances', {
            title: performanceData.title,
            duration: performanceData.duration,
            producer: performanceData.producer,
            image: performanceData.image,
            genre_id: performanceData.genre_id
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

interface PaginatedResponse<T> {
    current_page: number;
    data: T[];
}

interface ActorsResponse {
    actors: PaginatedResponse<IActor>;
    filters: {
        search: string | null;
        trashed: string | null;
    };
}

export const getActors = async (): Promise<IActor[]> => {
    try {
        const response = await api.get<ActorsResponse>('/actors');
        console.log('Повна відповідь від сервера:', response.data);
        if (response.data?.actors?.data) {
            return response.data.actors.data;
        }
        return [];
    } catch (error) {
        console.error('Помилка отримання акторів:', error);
        return [];
    }
};

export const getUsers = async (): Promise<IUser[]> => {
    const response = await api.get<IUser[]>('/users');
    return response.data;
};

export const getHalls = async (): Promise<IHall[]> => {
    const response = await api.get<IHall[]>('shows/hall');
    return response.data;
};

export const addShow = async (showData: {
    performance_id: number;
    datetime: string;
    hall_id: number;
    price: number;
}): Promise<IShow> => {
    try {
        const formattedData = {
            performance_id: Number(showData.performance_id),
            datetime: showData.datetime,
            hall_id: Number(showData.hall_id),
            price: Number(showData.price)
        };

        console.log('Форматовані дані для відправки:', formattedData);
        
        const response = await api.post<{show: IShow, message: string}>(
            '/shows', 
            formattedData,
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );
        
        console.log('Відповідь від сервера:', response.data);
        return response.data.show;
    } catch (error: any) {
        console.error('Деталі помилки:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status
        });
        throw error;
    }
};

export const getShows = async (): Promise<IShow[]> => {
    try {
        const response = await api.get<PaginatedResponse<IShow>>('/shows');
        console.log('Отримані дані показів:', response.data); 
        return response.data.data;
    } catch (error) {
        console.error('Помилка отримання показів:', error);
        return [];
    }
};

export const getGenres = async (): Promise<IGenre[]> => {
    try {
        console.log('Починаємо запит жанрів...');
        const response = await api.get<IGenre[]>('/performances/genres');
        console.log('Відповідь від сервера:', response.data);
        return response.data;
    } catch (error: any) {
        console.error('Деталі помилки:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status,
            config: error.config
        });
        
        if (error.response) {
            throw new Error(`Помилка сервера: ${error.response.data?.message || 'Невідома помилка'}`);
        } else if (error.request) {
            throw new Error('Немає відповіді від сервера');
        } else {
            throw new Error(`Помилка запиту: ${error.message}`);
        }
    }
};

export const addProducer = async (producerData: IProducer): Promise<IProducer> => {
    const response = await api.post<IProducer>('/producers', producerData);
    return response.data;
};

export const addActor = async (actorData: Omit<IActor, 'id'>): Promise<IActor> => {
    try {
        const response = await api.post<{actor: IActor}>('/actors', actorData);
        return response.data.actor;
    } catch (error: any) {
        console.error('Add actor error:', error.response?.data || error);
        throw error;
    }
};

interface ShowWithSeats {
    id: number;
    datetime: string;
    available_seats: ISeat[];
    booked_seats: ISeat[];
    price: number;
}

export const getShowsByPerformance = async (performanceId: number): Promise<IShow[]> => {
    try {
        const response = await api.get<IShow[]>(`/performances/${performanceId}/shows`);
        return response.data;
    } catch (error) {
        console.error('Помилка отримання показів:', error);
        return [];
    }
};

export const getShowSeats = async (showId: number): Promise<ShowWithSeats> => {
    try {
        const response = await api.get<ShowWithSeats>(`/shows/${showId}/seats`, {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        return response.data;
    } catch (error: any) {
        console.error('Помилка отримання місць:', error.response?.data || error);
        throw new Error(error.response?.data?.message || 'Помилка отримання місць');
    }
};

interface UpdateUserData {
    name?: string;
    email?: string;
    phone_numbers?: string;
    password?: string;
    password_confirmation?: string;
    age?: string;
}

interface BookTicketsRequest {
    tickets: {
        show_id: number;
        seat_id: number;
    }[];
    discount_id?: number;
}

export const bookTickets = async (bookingData: BookTicketsRequest): Promise<any> => {
    try {
        const response = await api.post('/tickets/book', {
            ...bookingData,
            silent: true
        });
        return response.data;
    } catch (error: any) {
        console.error('Помилка бронювання:', error.response?.data || error);
        throw new Error(error.response?.data?.message || 'Помилка при бронюванні квитків');
    }
};

export const getUserProfile = async (): Promise<IUser> => {
    const response = await api.get('/user');
    return response.data;
};

export const updateUserProfile = async (userId: number, userData: Partial<IUser>): Promise<IUser> => {
    try {
        const formattedData = {
            name: userData.name,
            email: userData.email,
            phone_numbers: userData.phone_numbers,
            age: userData.age ? parseInt(userData.age.toString()) : null,
            ...(userData.password && { 
                password: userData.password,
                password_confirmation: userData.password 
            })
        };

        const cleanedData = Object.fromEntries(
            Object.entries(formattedData).filter(([_, value]) => value !== undefined)
        );

        const response = await api.put<{user: IUser, message: string}>(`/users/${userId}`, cleanedData);
        
        return response.data.user;
    } catch (error: any) {
        console.error('Повна помилка:', error.response?.data || error);
        
        if (error.response?.data?.errors) {
            const errorMessages = Object.values(error.response.data.errors).flat();
            throw new Error(errorMessages.join(', '));
        }
        if (error.response?.data?.message) {
            throw new Error(error.response.data.message);
        }
        throw new Error('Помилка при оновленні профілю');
    }
};
