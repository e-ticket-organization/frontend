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

const API_BASE = '/api';

async function customFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${API_BASE}${normalizedEndpoint}`;
    
    console.log('Виконується запит до URL:', url);
    
    const token = localStorage.getItem('token');
    
    const headers = new Headers(options.headers);
    headers.set('Content-Type', 'application/json');
    headers.set('Accept', '*/*');

    
    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }
    
    const config: RequestInit = {
        ...options,
        headers,
        credentials: 'include',
        // mode: 'no-cors',
    };
    
    try {
        const response = await fetch(url, config);
        
        if (response.status === 401 && typeof window !== 'undefined') {
            try {
                const { token: newToken } = await refreshToken();
                const newHeaders = new Headers(headers);
                newHeaders.set('Authorization', `Bearer ${newToken}`);
                
                const retryResponse = await fetch(url, {
                    ...config,
                    headers: newHeaders
                });
                
                if (!retryResponse.ok) {
                    const errorText = await retryResponse.text();
                    let errorData;
                    try {
                        errorData = JSON.parse(errorText);
                    } catch (e) {
                        errorData = { message: errorText };
                    }
                    throw new Error(errorData.message || `Помилка запиту: ${retryResponse.status} ${retryResponse.statusText}`);
                }
                
                return await retryResponse.json();
            } catch (refreshError) {
                console.error('Помилка оновлення токена:', refreshError);
                
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('token');
                    localStorage.removeItem('refreshToken');
                    localStorage.removeItem('user');
                    
                    const user = getUser();
                    if (user?.status === 'admin') {
                        window.location.href = '/admin/login';
                    } else {
                        window.location.href = '/auth/login';
                    }
                }
                
                throw refreshError;
            }
        }
        
        if (!response.ok) {
            const errorText = await response.text();
            let errorData;
            try {
                errorData = JSON.parse(errorText);
            } catch (e) {
                errorData = { message: errorText };
            }
            
            console.error('Помилка запиту:', {
                status: response.status,
                statusText: response.statusText,
                data: errorData
            });
            
            throw new Error(errorData.message || `Помилка запиту: ${response.status} ${response.statusText}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Повна помилка запиту:', error);
        throw error;
    }
}

async function fetchWithParams<T>(endpoint: string, params: Record<string, any> = {}): Promise<T> {
    const queryParams = new URLSearchParams();
    
    for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
            queryParams.append(key, value.toString());
        }
    }
    
    const queryString = queryParams.toString();
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = queryString ? `${normalizedEndpoint}?${queryString}` : normalizedEndpoint;
    
    return customFetch<T>(url);
}

interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    limit: number;
    pages: number;
}

interface GetPerformancesParams {
    search?: string;
    limit?: number;
    page?: number;
}

export const getPerfomances = async (params: GetPerformancesParams = {}): Promise<IPerfomance[]> => {
    try {
        if (!API_BASE) {
            console.error('API_BASE не визначено. Перевірте налаштування змінних середовища.');
            return [];
        }

        const { search = '', limit = 10, page = 1 } = params;
        const url = '/performances/in-shows';
        console.log('Виконується запит до:', `${API_BASE}${url}`, { search, limit, page, in_shows: true });
        
        const data = await fetchWithParams<PaginatedResponse<IPerfomance>>(url, {
            search,
            limit,
            page,
            in_shows: true
        });
        
        console.log('Відповідь від сервера:', data);
        
        if (data && Array.isArray(data.items)) {
            return data.items;
        }
        
        console.error('Неочікувана структура відповіді:', data);
        return [];
    } catch (error) {
        console.error('Помилка запиту:', error);
        return [];
    }
};

export const getPerfomancesWithFilters = async (url: string): Promise<IPerfomance[]> => {
    try {
        const normalizedUrl = url.startsWith('/') ? url : `/${url}`;
        console.log('Виконується запит до:', `${API_BASE}${normalizedUrl}`);
        
        const data = await customFetch<PaginatedResponse<IPerfomance>>(normalizedUrl);
        console.log('Відповідь від сервера:', data);
        
        if (data && Array.isArray(data.items)) {
            return data.items;
        }
        
        console.error('Неочікувана структура відповіді:', data);
        return [];
    } catch (error) {
        console.error('Помилка запиту:', error);
        return [];
    }
};

export const getProducers = async (): Promise<IProducer[]> => {
    const data = await customFetch<PaginatedResponse<IProducer>>('/producers');
    if (data && Array.isArray(data.items)) {
        return data.items;
    }
    return [];
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
        
        return customFetch<IPerfomance>('/performances', {
            method: 'POST',
            body: JSON.stringify(formattedData)
        });
    } catch (error: any) {
        console.error('Response error:', error);
        
        if (error.status === 422) {
            throw new Error(error.message || 'Помилка валідації');
        }
        
        throw new Error(error.message || 'Помилка при додаванні вистави');
    }
};

export const getActors = async (page = 1, limit = 10): Promise<IActor[]> => {
    try {
        const response = await fetch(`https://backend-3ih2.onrender.com/api/actors?page=${page}&limit=${limit}`, {
            headers: {
                'accept': 'application/json'
            }
        });
        if (!response.ok) throw new Error('Не вдалося отримати акторів');
        const data = await response.json();
        return data.actors || data.items || [];
    } catch (error) {
        console.error('Помилка отримання акторів:', error);
        return [];
    }
};

export const getUsers = async (): Promise<IUser[]> => {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('https://backend-3ih2.onrender.com/api/users', {
            headers: {
                'accept': '*/*',
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) throw new Error('Не вдалося отримати користувачів');
        const data = await response.json();
        return data.users || data.items || data || [];
    } catch (error) {
        console.error('Помилка отримання користувачів:', error);
        return [];
    }
};

export const getHalls = async (): Promise<IHall[]> => {
    return customFetch<IHall[]>('shows/hall');
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
        
        const data = await customFetch<{show: IShow, message: string}>(
            '/shows', 
            {
                method: 'POST',
                body: JSON.stringify(formattedData)
            }
        );
        
        console.log('Відповідь від сервера:', data);
        return data.show;
    } catch (error) {
        console.error('Деталі помилки:', error);
        throw error;
    }
};

export const getShows = async (): Promise<IShow[]> => {
    try {
        const data = await customFetch<IShow[]>('/shows');
        console.log('Отримані дані показів:', data); 
        
        if (Array.isArray(data)) {
            return data;
        }
        
        console.error('Неочікувана структура відповіді:', data);
        return [];
    } catch (error) {
        console.error('Помилка отримання показів:', error);
        return [];
    }
};

export const getGenres = async (): Promise<IGenre[]> => {
    try {
        console.log('Починаємо запит жанрів...');
        const url = 'genres';
        
        const data = await customFetch<IGenre[]>(url);
        console.log('Відповідь від сервера:', data);
        return data;
    } catch (error: any) {
        console.error('Деталі помилки при отриманні жанрів:', error);
        return [];
    }
};

export const addProducer = async (producerData: IProducer): Promise<IProducer> => {
    return customFetch<IProducer>('/producers', {
        method: 'POST',
        body: JSON.stringify(producerData)
    });
};

export const addActor = async (actorData: Omit<IActor, 'id'>): Promise<IActor> => {
    try {
        const data = await customFetch<{actor: IActor}>('/actors', {
            method: 'POST',
            body: JSON.stringify(actorData)
        });
        return data.actor;
    } catch (error) {
        console.error('Add actor error:', error);
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
        console.log('Отримання показів для вистави з ID:', performanceId);
        const data = await customFetch<IShow[]>(`/performances/${performanceId}/shows`);
        console.log('Відповідь від сервера:', data);
        
        if (Array.isArray(data)) {
            return data;
        }
        
        console.error('Неочікувана структура відповіді:', data);
        return [];
    } catch (error) {
        console.error('Помилка отримання показів:', error);
        return [];
    }
};

export const getShowSeats = async (showId: number): Promise<ShowWithSeats> => {
    try {
        return customFetch<ShowWithSeats>(`/shows/${showId}/seats`);
    } catch (error) {
        console.error('Помилка отримання місць:', error);
        throw new Error('Помилка отримання місць');
    }
};

interface BookTicketsRequest {
    tickets: {
        show_id: number;
        seat_id: number;
    }[];
    discount_id?: number;
    paymentData: {
        currency: string;
        metadata: {
            source: string;
        };
        description: string;
    };
}

export const bookTickets = async (bookingData: BookTicketsRequest): Promise<any> => {
    try {
        const defaultPaymentData = {
            currency: "uah",
            metadata: {
                source: "web-app"
            },
            description: "Оплата квитків на виставу"
        };

        const formattedData = {
            ...bookingData,
            paymentData: bookingData.paymentData || defaultPaymentData,
            silent: true
        };

        console.log('Відправка даних для бронювання:', formattedData);
        
        return customFetch('/tickets/book', {
            method: 'POST',
            body: JSON.stringify(formattedData)
        });
    } catch (error) {
        console.error('Помилка бронювання:', error);
        throw new Error('Помилка при бронюванні квитків');
    }
};

export const getUserProfile = async (): Promise<IUser> => {
    return customFetch<IUser>('/users/profile');
};

export const updateUserProfile = async (userData: Partial<IUser>): Promise<IUser> => {
    try {
        const formattedData = {
            name: userData.name,
            email: userData.email,
            phone_numbers: userData.phoneNumbers,
            dateOfBirth: userData.dateOfBirth,
            ...(userData.password && { 
                password: userData.password,
                password_confirmation: userData.password 
            })
        };

        const cleanedData = Object.fromEntries(
            Object.entries(formattedData).filter(([_, value]) => value !== undefined)
        );

        console.log('Відправка даних на сервер:', cleanedData);

        const data = await customFetch<{user: IUser, message: string}>(`/users/profile`, {
            method: 'PATCH',
            body: JSON.stringify(cleanedData)
        });
        
        return data.user;
    } catch (error: any) {
        console.error('Повна помилка:', error);
        throw new Error(error.message || 'Помилка при оновленні профілю');
    }
};

export const searchPerformances = async (query: string, type: 'title' | 'actor'): Promise<IPerfomance[]> => {
    try {
        const data = await fetchWithParams<IPerfomance[]>('/performances', { search: query });
        
        if (data) {
            return data.filter(performance => 
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
        const data = await fetchWithParams<IPerfomance>(`/performances/${id}`, {
            include: 'producer,actors,genres'
        });
        
        if (!data.producer) {
            data.producer = {
                id: 0,
                first_name: 'Не призначено',
                last_name: '',
                phone_number: '',
                email: '',
                date_of_birth: ''
            };
        }
        
        console.log('Отримані дані вистави:', data);
        return data;
    } catch (error) {
        console.error('Помилка отримання вистави:', error);
        throw error;
    }
};

export const getUserTickets = async (): Promise<ITicket[]> => {
  try {
    return customFetch<ITicket[]>('/tickets/user/current');
  } catch (error) {
    console.error('Помилка отримання квитків:', error);
    throw new Error('Помилка отримання квитків');
  }
};

export const cancelTicketBooking = async (ticketId: number) => {
    try {
        console.log('Початок відміни бронювання для квитка:', ticketId);
        
        const data = await customFetch(`/tickets/${ticketId}/cancel`, {
            method: 'POST'
        });
        
        console.log('Відповідь від сервера:', data);
        return data;
    } catch (error) {
        console.error('Помилка відміни бронювання:', error);
        throw new Error('Не вдалося відмінити бронювання. Спробуйте пізніше.');
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
        const data = await customFetch<{ performance: IPerfomance }>(
            `/performances/${performanceId}`, 
            {
                method: 'PUT',
                body: JSON.stringify(updateData)
            }
        );
        
        if (!data) {
            throw new Error('Відповідь сервера не містить даних');
        }
        
        return data.performance;
    } catch (error: any) {
        console.error('Помилка оновлення вистави:', error);
        throw new Error(error.message || 'Помилка при оновленні вистави');
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
        const data = await customFetch<{ actor: IActor }>(
            `/actors/${actorId}`,
            {
                method: 'PUT',
                body: JSON.stringify(updateData)
            }
        );
        
        if (!data) {
            throw new Error('Відповідь сервера не містить даних');
        }
        
        return data.actor;
    } catch (error: any) {
        console.error('Помилка оновлення актора:', error);
        throw new Error(error.message || 'Помилка при оновленні актора');
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
        const data = await customFetch<IProducer>(
            `/producers/${producerId}`,
            {
                method: 'PUT',
                body: JSON.stringify(updateData)
            }
        );
        
        if (!data) {
            throw new Error('Відповідь сервера не містить даних');
        }
        
        return {
            ...data,
            id: producerId
        };
    } catch (error: any) {
        console.error('Помилка оновлення продюсера:', error);
        throw new Error(error.message || 'Помилка при оновленні продюсера');
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
    const data = await customFetch<{ show: IShow }>(
      `/shows/${showId}`,
      {
        method: 'PUT',
        body: JSON.stringify(updateData)
      }
    );
    
    if (!data) {
      throw new Error('Відповідь сервера не містить даних');
    }
    
    return data.show;
  } catch (error: any) {
    console.error('Помилка оновлення показу:', error);
    throw new Error(error.message || 'Помилка при оновленні показу');
  }
};

export const getShowById = async (showId: number): Promise<IShow> => {
  try {
    return customFetch<IShow>(`/shows/${showId}`);
  } catch (error) {
    console.error('Помилка отримання даних показу:', error);
    throw new Error('Помилка отримання даних показу');
  }
};

interface IUserUpdate {
    email: string;
}

export const updateUser = async (userId: number, updateData: IUserUpdate): Promise<IUser> => {
    try {
        const data = await customFetch<{ user: IUser }>(
            `/users/${userId}`,
            {
                method: 'PUT',
                body: JSON.stringify(updateData)
            }
        );
        
        if (!data) {
            throw new Error('Відповідь сервера не містить даних');
        }
        
        return data.user;
    } catch (error: any) {
        console.error('Помилка оновлення користувача:', error);
        throw new Error(error.message || 'Помилка при оновленні користувача');
    }
};

export const deletePerformance = async (id: number): Promise<void> => {
    try {
        await customFetch(`/performances/${id}`, { method: 'DELETE' });
    } catch (error: any) {
        throw new Error(error.message || 'Помилка видалення вистави');
    }
};

export const deleteActor = async (id: number): Promise<void> => {
    try {
        await customFetch(`/actors/${id}`, { method: 'DELETE' });
    } catch (error: any) {
        throw new Error(error.message || 'Помилка видалення актора');
    }
};

export const deleteProducer = async (id: number): Promise<void> => {
    try {
        await customFetch(`/producers/${id}`, { method: 'DELETE' });
    } catch (error: any) {
        throw new Error(error.message || 'Помилка видалення продюсера');
    }
};

export const deleteShow = async (id: number): Promise<void> => {
    try {
        await customFetch(`/shows/${id}`, { method: 'DELETE' });
    } catch (error: any) {
        throw new Error(error.message || 'Помилка видалення показу');
    }
};

export const deleteUser = async (id: number): Promise<void> => {
    try {
        await customFetch(`/users/${id}`, { method: 'DELETE' });
    } catch (error: any) {
        throw new Error(error.message || 'Помилка видалення користувача');
    }
};

export const getShowDetailsById = async (id: number): Promise<IShow> => {
    try {
        const data = await customFetch<IShow>(`/shows/${id}`);
        console.log('Отримані дані показу:', data);
        return data;
    } catch (error) {
        console.error('Помилка отримання даних показу:', error);
        throw new Error('Помилка отримання даних показу');
    }
};
