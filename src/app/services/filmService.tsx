import axios from 'axios';
import { IPerfomance } from '@/app/types/perfomance';
import { IShow } from '@/app/types/show';
import { IProducer } from '@/app/types/producer';
import { IHall } from '@/app/types/hall';
import { getUser, refreshToken } from './authService';
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
                const token = localStorage.getItem('token');
                error.config.headers.Authorization = `Bearer ${token}`;
                return api.request(error.config);
            } catch (refreshError) {
                console.error('Помилка оновлення токена:', refreshError);
            }
        }
        return Promise.reject(error);
    }
);

export const getPerfomances = async (): Promise<IPerfomance[]> => {
    const response = await api.get<IPerfomance[]>('/performances');
    return response.data;
};

export const getPerfomancesWithFilters = async (url: string): Promise<IPerfomance[]> => {
    const response = await api.get<IPerfomance[]>(url);
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
    actors: number[];
}

export const addPerfomance = async (performanceData: IPerformanceCreate): Promise<IPerfomance> => {
    try {
        const formattedData = {
            title: performanceData.title,
            duration: Number(performanceData.duration),
            producer: Number(performanceData.producer),
            image: performanceData.image,
            genre_id: Number(performanceData.genre_id),
            actors: performanceData.actors
        };

        console.log('Дані для відправки:', formattedData);
        
        const response = await api.post<IPerfomance>('/performances', formattedData);
        return response.data;
    } catch (error: any) {
        console.error('Response error:', error.response?.data);
        
        if (error.response?.status === 422) {
            const validationErrors = error.response.data.errors;
            const firstError = Object.values(validationErrors)[0];
            throw new Error(Array.isArray(firstError) ? firstError[0] : firstError);
        }
        
        throw new Error(error.response?.data?.message || 'Помилка при додаванні вистави');
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

interface SimpleResponse<T> {
    data: T[];
}

export const getActors = async (): Promise<IActor[]> => {
    try {
        const response = await api.get<ActorsResponse | SimpleResponse<IActor> | IActor[]>('/actors');
        console.log('Повна відповідь від сервера:', response.data);
        
        if (Array.isArray(response.data)) {
            return response.data;
        } else if ('actors' in response.data && response.data.actors?.data) {
            return response.data.actors.data;
        } else if ('data' in response.data) {
            return response.data.data;
        }
        
        console.error('Неочікувана структура відповіді:', response.data);
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
            formattedData
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
        console.log('Відпь від сервера:', response.data);
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

interface SearchResponse {
    data: IPerfomance[];
}

export const searchPerformances = async (query: string, type: 'title' | 'actor'): Promise<IPerfomance[]> => {
    try {
        const response = await api.get<IPerfomance[]>('/performances', {
            params: {
                search: query
            }
        });
        
        if (response.data) {
            return response.data.filter(performance => 
                performance.title.toLowerCase().includes(query.toLowerCase())
            );
        }
        
        return [];
    } catch (error) {
        console.error('Помилка пошуку:', error);
        return [];
    }
};

export const getPerfomanceById = async (id: number): Promise<IPerfomance> => {
    try {
        const response = await api.get<IPerfomance>(`/performances/${id}`, {
            params: {
                include: 'producer,actors,genres'
            }
        });
        
        if (!response.data.producer) {
            response.data.producer = {
                id: 0,
                first_name: 'Не призначено',
                last_name: ''
            };
        }
        
        console.log('Отримані дані вистави:', response.data);
        return response.data;
    } catch (error) {
        console.error('Помилка отримання вистави:', error);
        throw error;
    }
};

export const getUserTickets = async (): Promise<ITicket[]> => {
  try {
    const response = await api.get<ITicket[]>('/tickets/user');
    return response.data;
  } catch (error: any) {
    console.error('Помилка отримання квитків:', error.response?.data || error);
    throw new Error(
      error.response?.data?.message || 
      error.response?.data?.error || 
      'Помилка отримання квитків'
    );
  }
};

export const cancelTicketBooking = async (ticketId: number) => {
    try {
        console.log('Початок відміни бронювання для квитка:', ticketId);
        
        const response = await api.post(`/tickets/${ticketId}/cancel`, {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        
        console.log('Відповідь від сервер:', response.data);
        return response.data;
    } catch (error: any) {
        console.error('Помилка відміни бронювання:', error.response?.data || error);
        
        const errorMessage = error.response?.data?.message 
            || error.response?.data?.error 
            || 'Не вдалося відмінити бронювання. Спробуйте пізніше.';
            
        throw new Error(errorMessage);
    }
};

interface IPerformanceUpdate {
    title: string;
    duration: number;
    image: string;
    producer: number;
    genre_id: number;
    actors: number[];
}

export const updatePerformance = async (performanceId: number, updateData: IPerformanceUpdate): Promise<IPerfomance> => {
    try {
        console.log('Відправка даних на сервер:', updateData);
        const response = await api.put<{ performance: IPerfomance }>(
            `/performances/${performanceId}`, 
            updateData
        );
        
        if (!response.data) {
            throw new Error('Відповідь сервера не містить даних');
        }
        
        return response.data.performance;
    } catch (error: any) {
        console.error('Помилка оновлення вистави:', error.response?.data || error);
        
        const errorMessage = error.response?.data?.errors
            ? Object.values(error.response.data.errors).join(', ')
            : error.response?.data?.message || 'Помилка при оновленні вистави';
            
        throw new Error(errorMessage);
    }
};

interface IActorUpdate {
    first_name: string;
    last_name: string;
    date_of_birth: string;
    passport: string;
    phone_number: string;
}

export const updateActor = async (actorId: number, updateData: IActorUpdate): Promise<IActor> => {
    try {
        console.log('Відправка даних на сервер:', updateData);
        const response = await api.put<{ actor: IActor }>(
            `/actors/${actorId}`,
            updateData
        );
        
        if (!response.data) {
            throw new Error('Відповідь сервера не містить даних');
        }
        
        return response.data.actor;
    } catch (error: any) {
        console.error('Помилка оновлення актора:', error.response?.data || error);
        
        const errorMessage = error.response?.data?.errors
            ? Object.values(error.response.data.errors).join(', ')
            : error.response?.data?.message || 'Помилка при оновленні актора';
            
        throw new Error(errorMessage);
    }
};

interface IProducerUpdate {
    first_name: string;
    last_name: string;
    date_of_birth: string;
    email: string;
    phone_number: string;
}

export const updateProducer = async (producerId: number, updateData: IProducerUpdate): Promise<IProducer> => {
    try {
        console.log('Відправка даних на сервер:', updateData);
        const response = await api.put<IProducer>(
            `/producers/${producerId}`,
            updateData
        );
        
        if (!response.data) {
            throw new Error('Відповідь сервера не містить даних');
        }
        
        return {
            ...response.data,
            id: producerId
        };
    } catch (error: any) {
        console.error('Помилка оновлення продюсера:', error.response?.data || error);
        throw new Error(
            error.response?.data?.message || 
            error.response?.data?.error || 
            'Помилка при оновленні продюсера'
        );
    }
};

interface IShowUpdate {
  performance_id: number;
  datetime: string;
  hall_id: number;
  price: number;
}

export const updateShow = async (showId: number, updateData: IShowUpdate): Promise<IShow> => {
  try {
    console.log('Відправка даних на сервер:', updateData);
    const response = await api.put<{ show: IShow }>(
      `/shows/${showId}`,
      updateData
    );
    
    if (!response.data) {
      throw new Error('В��дповідь сервера не містить даних');
    }
    
    return response.data.show;
  } catch (error: any) {
    console.error('Помилка оновлення показу:', error.response?.data || error);
    
    const errorMessage = error.response?.data?.errors
      ? Object.values(error.response.data.errors).join(', ')
      : error.response?.data?.message || 'Помилка при оновленні показу';
      
    throw new Error(errorMessage);
  }
};

export const getShowById = async (showId: number): Promise<IShow> => {
  try {
    const response = await api.get<IShow>(`/shows/${showId}`);
    return response.data;
  } catch (error: any) {
    console.error('Помилка отримання даних показу:', error);
    throw new Error(error.response?.data?.message || 'Помилка отримання даних показу');
  }
};

interface IUserUpdate {
    email: string;
}

export const updateUser = async (userId: number, updateData: IUserUpdate): Promise<IUser> => {
    try {
        const response = await api.put<{ user: IUser }>(
            `/users/${userId}`,
            updateData
        );
        
        if (!response.data) {
            throw new Error('Відповідь сервера не містить даних');
        }
        
        return response.data.user;
    } catch (error: any) {
        console.error('Помилка оновлення користувача:', error.response?.data || error);
        
        const errorMessage = error.response?.data?.errors
            ? Object.values(error.response.data.errors).join(', ')
            : error.response?.data?.message || 'Помилка при оновленні користувача';
            
        throw new Error(errorMessage);
    }
};

export const deletePerformance = async (id: number): Promise<void> => {
    try {
        await api.delete(`/performances/${id}`);
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Помилка видалення вистави');
    }
};

export const deleteActor = async (id: number): Promise<void> => {
    try {
        await api.delete(`/actors/${id}`);
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Помилка видалення актора');
    }
};

export const deleteProducer = async (id: number): Promise<void> => {
    try {
        await api.delete(`/producers/${id}`);
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Помилка видалення продюсера');
    }
};

export const deleteShow = async (id: number): Promise<void> => {
    try {
        await api.delete(`/shows/${id}`);
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Помилка видалення показу');
    }
};

export const deleteUser = async (id: number): Promise<void> => {
    try {
        await api.delete(`/users/${id}`);
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Помилка видалення користувача');
    }
};
