import { IPerfomance, IPerfomanceCreate } from '@/app/types/perfomance';
import { IShow, IShowCreate } from '@/app/types/show';
import { IProducer } from '@/app/types/producer';
import { IHall } from '@/app/types/hall';
import { getUser, refreshToken } from './authService';
import { IUser } from '../types/user';
import { IActor } from '../types/actor';
import { IGenre } from '../types/genre';
import { ISeat } from '../types/seat';
import { ITicket } from '../types/ticket';
import { ICity } from '../types/city';
import { ITheater } from '../types/theater';

// Використовуємо проксі Next.js для уникнення проблем з CORS
const API_BASE = '/api';

async function customFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${API_BASE}${normalizedEndpoint}`;
    
    console.log('API_BASE:', API_BASE);
    console.log('endpoint:', endpoint);
    console.log('normalizedEndpoint:', normalizedEndpoint);
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
                        window.location.href = '/';
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
                url: url,
                method: options.method || 'GET',
                status: response.status,
                statusText: response.statusText,
                data: errorData,
                errorText: errorText
            });
            
            throw new Error(errorData.message || `Помилка запиту: ${response.status} ${response.statusText}`);
        }
        
        const responseData = await response.json();
        console.log('Успішна відповідь від сервера:', {
            url: url,
            method: options.method || 'GET',
            status: response.status,
            data: responseData
        });
        
        return responseData;
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

interface PerformancesResponse {
    performances: IPerfomance[];
    meta: {
        total: number;
        page: number;
        limit: number;
        pages: number;
    };
}

export const getPerfomances = async (params: GetPerformancesParams = {}): Promise<PerformancesResponse> => {
    try {
        if (!API_BASE) {
            console.error('API_BASE не визначено. Перевірте налаштування змінних середовища.');
            return { performances: [], meta: { total: 0, page: 1, limit: 10, pages: 0 } };
        }

        const { search = '', limit = 10, page = 1 } = params;
        const url = '/performances/in-shows';
        console.log('Виконується запит до:', `${API_BASE}${url}`, { search, limit, page, in_shows: true });
        
        const data = await fetchWithParams<PaginatedResponse<IPerfomance>>(url, {
            search,
            limit: limit.toString(),
            page: page.toString(),
            in_shows: 'true'
        });
        
        console.log('Відповідь від сервера:', data);
        
        if (data && Array.isArray(data.items)) {
            return {
                performances: data.items,
                meta: {
                    total: data.total || 0,
                    page: data.page || 1,
                    limit: data.limit || 10,
                    pages: data.pages || Math.ceil((data.total || 0) / (data.limit || 10))
                }
            };
        }
        
        console.error('Неочікувана структура відповіді:', data);
        return { performances: [], meta: { total: 0, page: 1, limit: 10, pages: 0 } };
    } catch (error) {
        console.error('Помилка запиту:', error);
        return { performances: [], meta: { total: 0, page: 1, limit: 10, pages: 0 } };
    }
};

export const getAllPerformances = async (): Promise<IPerfomance[]> => {
    try {
        const data = await getPerfomances({ page: 1, limit: 1000 });
        return data.performances;
    } catch (error) {
        console.error('Помилка отримання всіх вистав:', error);
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

export const getPerformancesWithLocationFilters = async (filters: {
  search?: string;
  genre?: string;
  cityId?: number;
  theaterId?: number;
  limit?: number;
  page?: number;
} = {}): Promise<IPerfomance[]> => {
  try {
    const params = new URLSearchParams();
    
    if (filters.search) params.append('search', filters.search);
    if (filters.genre) params.append('genre_id', filters.genre);
    if (filters.cityId) params.append('city_id', filters.cityId.toString());
    if (filters.theaterId) params.append('theater_id', filters.theaterId.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.page) params.append('page', filters.page.toString());
    
    params.append('in_shows', 'true');
    
    const url = `/performances/in-shows${params.toString() ? `?${params.toString()}` : ''}`;
    console.log('🔍 Запит з фільтрами:', url);
    console.log('🔍 Параметри фільтрів:', filters);
    
    const data = await customFetch<PaginatedResponse<IPerfomance>>(url);
    console.log('📦 Відповідь від сервера:', data);
    
    if (data && Array.isArray(data.items)) {
      console.log('✅ Отримано вистав:', data.items.length);
      return data.items;
    }
    
    console.error('❌ Неочікувана структура відповіді:', data);
    return [];
  } catch (error) {
    console.error('❌ Помилка отримання вистав з фільтрами:', error);
    return [];
  }
};

interface ProducersResponse {
    producers: IProducer[];
    meta: {
        total: number;
        page: number;
        limit: number;
        pages: number;
    };
}

export const getProducers = async (page = 1, limit = 10): Promise<ProducersResponse> => {
    try {
        const data = await customFetch<PaginatedResponse<IProducer>>(`/producers?page=${page}&limit=${limit}`);
        console.log('Отримані дані продюсерів:', data);
        
        if (data && data.items) {
            return {
                producers: data.items,
                meta: {
                    total: data.total || 0,
                    page: data.page || 1,
                    limit: data.limit || 10,
                    pages: data.pages || Math.ceil((data.total || 0) / (data.limit || 10))
                }
            };
        }
        
        return { producers: [], meta: { total: 0, page: 1, limit: 10, pages: 0 } };
    } catch (error) {
        console.error('Помилка отримання продюсерів:', error);
        return { producers: [], meta: { total: 0, page: 1, limit: 10, pages: 0 } };
    }
};

export const getAllProducers = async (): Promise<IProducer[]> => {
    try {
        const data = await customFetch<PaginatedResponse<IProducer>>(`/producers?page=1&limit=1000`);
        return data?.items || [];
    } catch (error) {
        console.error('Помилка отримання всіх продюсерів:', error);
        return [];
    }
};

export const addPerfomance = async (performanceData: IPerfomanceCreate): Promise<IPerfomance> => {
    try {
        const formattedData = {
            title: performanceData.title,
            description: performanceData.description,
            duration: performanceData.duration,
            image: performanceData.image,
            producer_id: performanceData.producer_id,
            genre_ids: performanceData.genre_ids,
            actor_ids: performanceData.actor_ids,
            premiereDate: performanceData.premiereDate,
            price: performanceData.price,
            city_id: performanceData.city_id,
            theater_id: performanceData.theater_id
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

interface ActorsResponse {
    actors: IActor[];
    meta: {
        total: number;
        page: number;
        limit: number;
        pages: number;
    };
}

export const getActors = async (page = 1, limit = 10): Promise<ActorsResponse> => {
    try {
        // Використовуємо customFetch та правильну структуру відповіді згідно з бекендом
        const data = await customFetch<PaginatedResponse<IActor>>(`/actors?page=${page}&limit=${limit}`);
        console.log('Отримані дані акторів:', data);
        
        // Бекенд повертає {items: [], total: number, page: number, limit: number, pages: number}
        if (data && data.items) {
            return {
                actors: data.items,
                meta: {
                    total: data.total || 0,
                    page: data.page || 1,
                    limit: data.limit || 10,
                    pages: data.pages || Math.ceil((data.total || 0) / (data.limit || 10))
                }
            };
        }
        
        return { actors: [], meta: { total: 0, page: 1, limit: 10, pages: 0 } };
    } catch (error) {
        console.error('Помилка отримання акторів:', error);
        return { actors: [], meta: { total: 0, page: 1, limit: 10, pages: 0 } };
    }
};

// Функція для отримання всіх акторів без пагінації (для форм)
export const getAllActors = async (): Promise<IActor[]> => {
    try {
        // Отримуємо велику кількість акторів за один раз
        const data = await customFetch<PaginatedResponse<IActor>>(`/actors?page=1&limit=1000`);
        console.log('Отримані всі актори:', data);
        
        return data?.items || [];
    } catch (error) {
        console.error('Помилка отримання всіх акторів:', error);
        return [];
    }
};

interface UsersResponse {
    users: IUser[];
    meta: {
        total: number;
        page: number;
        limit: number;
        pages: number;
    };
}

export const getUsers = async (page = 1, limit = 10): Promise<UsersResponse> => {
    try {
        const data = await customFetch<IUser[]>(`/users?page=${page}&limit=${limit}`);
        console.log('Отримані дані користувачів:', data);
        
        if (data && Array.isArray(data)) {
            // Симулюємо пагінацію на фронтенді, оскільки API повертає всі дані
            const startIndex = (page - 1) * limit;
            const endIndex = startIndex + limit;
            const paginatedUsers = data.slice(startIndex, endIndex);
            
            return {
                users: paginatedUsers,
                meta: {
                    total: data.length,
                    page: page,
                    limit: limit,
                    pages: Math.ceil(data.length / limit)
                }
            };
        }
        
        return { users: [], meta: { total: 0, page: 1, limit: 10, pages: 0 } };
    } catch (error) {
        console.error('Помилка отримання користувачів:', error);
        return { users: [], meta: { total: 0, page: 1, limit: 10, pages: 0 } };
    }
};

export const getHalls = async (): Promise<IHall[]> => {
    return customFetch<IHall[]>('shows/halls/all');
};

export const addShow = async (showData: IShowCreate): Promise<IShow> => {
    try {
        console.log('Відправляємо дані на сервер:', showData);
        
        const formattedData = {
            performance_id: showData.performance_id,
            datetime: showData.datetime.toISOString(),
            date: showData.date ? showData.date.toISOString().split('T')[0] : showData.datetime.toISOString().split('T')[0],
            hall_id: showData.hall_id,
            price: showData.price,
            ...(showData.city_id && { city_id: showData.city_id }),
            ...(showData.theater_id && { theater_id: showData.theater_id })
        };

        console.log('Форматовані дані:', formattedData);

        return customFetch<IShow>('/shows', {
            method: 'POST',
            body: JSON.stringify(formattedData)
        });
    } catch (error: any) {
        console.error('Помилка додавання показу:', error);
        throw new Error(error.message || 'Помилка при додаванні показу');
    }
};

interface ShowsResponse {
    shows: IShow[];
    meta: {
        total: number;
        page: number;
        limit: number;
        pages: number;
    };
}

export const getShows = async (page = 1, limit = 10): Promise<ShowsResponse> => {
    try {
        const data = await customFetch<IShow[]>(`/shows?page=${page}&limit=${limit}`);
        console.log('Отримані дані показів:', data);
        
        if (data && Array.isArray(data)) {
            // Симулюємо пагінацію на фронтенді, оскільки API повертає всі дані
            const startIndex = (page - 1) * limit;
            const endIndex = startIndex + limit;
            const paginatedShows = data.slice(startIndex, endIndex);
            
            return {
                shows: paginatedShows,
                meta: {
                    total: data.length,
                    page: page,
                    limit: limit,
                    pages: Math.ceil(data.length / limit)
                }
            };
        }
        
        return { shows: [], meta: { total: 0, page: 1, limit: 10, pages: 0 } };
    } catch (error) {
        console.error('Помилка отримання показів:', error);
        return { shows: [], meta: { total: 0, page: 1, limit: 10, pages: 0 } };
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

export const addProducer = async (producerData: Omit<IProducer, 'id' | 'created_at' | 'updated_at'>): Promise<IProducer> => {
    return customFetch<IProducer>('/producers', {
        method: 'POST',
        body: JSON.stringify(producerData)
    });
};

export const addActor = async (actorData: any): Promise<IActor> => {
    try {
        const data = await customFetch<IActor>('/actors', {
            method: 'POST',
            body: JSON.stringify(actorData)
        });
        return data;
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

export const validatePromoCode = async (promoCode: string): Promise<any> => {
    try {
        const upperPromoCode = promoCode.toUpperCase();
        console.log('Перевірка промокоду:', upperPromoCode);
        
        return customFetch(`/discounts/promo/${upperPromoCode}`, {
            method: 'GET'
        });
    } catch (error) {
        console.error('Помилка перевірки промокоду:', error);
        throw new Error('Промокод не знайдено або недійсний');
    }
};

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
    description: string;
    duration: number;
    image?: string;
    producer_id: number;
    genre_ids?: number[];
    actor_ids?: number[];
    premiereDate: string;
    price: number;
    city_id: number;
    theater_id: number;
}

export const updatePerformance = async (performanceId: number, updateData: IPerformanceUpdate): Promise<IPerfomance> => {
    try {
        console.log('Відправка даних на сервер:', updateData);
        const data = await customFetch<any>(
            `/performances/${performanceId}`, 
            {
                method: 'PUT',
                body: JSON.stringify(updateData)
            }
        );
        
        console.log('Отримана відповідь від сервера:', data);
        
        if (!data) {
            throw new Error('Відповідь сервера не містить даних');
        }
        
        // Перевіряємо різні можливі структури відповіді
        let performance: IPerfomance;
        
        if (data.performance) {
            // Структура: { performance: {...} }
            performance = data.performance;
        } else if (data.id) {
            // Структура: { id: ..., title: ..., ... } (пряма відповідь)
            performance = data;
        } else if (Array.isArray(data) && data.length > 0) {
            // Структура: [{ id: ..., title: ..., ... }]
            performance = data[0];
        } else {
            console.error('Невідома структура відповіді:', data);
            throw new Error('Сервер повернув дані в неочікуваному форматі');
        }
        
        if (!performance || !performance.id) {
            console.error('Некоректні дані вистави:', performance);
            throw new Error('Сервер не повернув валідні дані вистави');
        }
        
        console.log('Успішно оброблено відповідь:', performance);
        return performance;
    } catch (error: any) {
        console.error('Помилка оновлення вистави:', error);
        
        // Додаткове логування для діагностики
        if (error.message && error.message.includes('404')) {
            throw new Error('Вистава не знайдена на сервері');
        } else if (error.message && error.message.includes('500')) {
            throw new Error('Внутрішня помилка сервера. Перевірте дані та спробуйте знову');
        }
        
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
    const showDateTime = new Date(updateData.datetime);
    
    const formattedData = {
      performance_id: Number(updateData.performance_id),
      datetime: showDateTime.toISOString(),
      date: showDateTime.toISOString().split('T')[0],
      hall_id: Number(updateData.hall_id),
      price: Number(updateData.price)
    };

    console.log('Відправка даних на сервер:', formattedData);
    const data = await customFetch<{ show: IShow }>(
      `/shows/${showId}`,
      {
        method: 'PUT',
        body: JSON.stringify(formattedData)
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

export const updateNewsletterSubscription = async (newsletterSubscription: boolean): Promise<any> => {
    try {
        console.log('Оновлення підписки на розсилку:', newsletterSubscription);
        const data = await customFetch('/users/newsletter-subscription', {
            method: 'PATCH',
            body: JSON.stringify({
                newsletterSubscription: newsletterSubscription
            })
        });
        
        console.log('Відповідь від сервера:', data);
        return data;
    } catch (error: any) {
        console.error('Помилка оновлення підписки на розсилку:', error);
        throw new Error(error.message || 'Помилка при оновленні підписки на розсилку');
    }
};

export const getTicketHistory = async (): Promise<ITicket[]> => {
  try {
    return customFetch<ITicket[]>('/tickets/history');
  } catch (error) {
    console.error('Помилка отримання історії квитків:', error);
    throw new Error('Помилка отримання історії квитків');
  }
};

// API для роботи з містами та театрами
export const getCities = async (): Promise<ICity[]> => {
  try {
    return customFetch<ICity[]>('/cities');
  } catch (error) {
    console.error('Помилка отримання міст:', error);
    throw new Error('Помилка отримання міст');
  }
};

export const getCitiesWithShows = async (): Promise<ICity[]> => {
  try {
    return customFetch<ICity[]>('/cities/with-shows');
  } catch (error) {
    console.error('Помилка отримання міст з виставами:', error);
    throw new Error('Помилка отримання міст з виставами');
  }
};

export const getCitiesWithUpcomingShows = async (): Promise<ICity[]> => {
  try {
    return customFetch<ICity[]>('/cities/with-upcoming-shows');
  } catch (error) {
    console.error('Помилка отримання міст з майбутніми показами:', error);
    throw new Error('Помилка отримання міст з майбутніми показами');
  }
};

export const getCityWithShows = async (cityId: number): Promise<ICity> => {
  try {
    return customFetch<ICity>(`/cities/${cityId}/with-shows`);
  } catch (error) {
    console.error('Помилка отримання міста з показами:', error);
    throw new Error('Помилка отримання міста з показами');
  }
};

export const getCityWithUpcomingShows = async (cityId: number): Promise<ICity> => {
  try {
    return customFetch<ICity>(`/cities/${cityId}/with-upcoming-shows`);
  } catch (error) {
    console.error('Помилка отримання міста з майбутніми показами:', error);
    throw new Error('Помилка отримання міста з майбутніми показами');
  }
};

export const getTheaters = async (): Promise<ITheater[]> => {
  try {
    return customFetch<ITheater[]>('/cities/theaters');
  } catch (error) {
    console.error('Помилка отримання театрів:', error);
    throw new Error('Помилка отримання театрів');
  }
};

export const getTheatersByCity = async (cityId: number): Promise<ITheater[]> => {
  try {
    return customFetch<ITheater[]>(`/cities/${cityId}/theaters`);
  } catch (error) {
    console.error('Помилка отримання театрів міста:', error);
    throw new Error('Помилка отримання театрів міста');
  }
};

export const getTheatersWithShows = async (cityId?: number): Promise<ITheater[]> => {
  try {
    if (cityId) {
      try {
        const cityData = await customFetch<ICity>(`/cities/${cityId}/with-upcoming-shows`);
        if (cityData.theaters && Array.isArray(cityData.theaters)) {
          return cityData.theaters;
        }
      } catch (error: any) {
        console.log('Ендпоінт міста з показами не працює, використовуємо fallback');
      }
      
      try {
        const theaters = await customFetch<ITheater[]>(`/cities/${cityId}/theaters`);
        
        const allShows = await customFetch<IShow[]>('/shows');
        const cityShows = allShows.filter((show: IShow) => 
          show.city_id === cityId && new Date(show.datetime) > new Date()
        );
        
        const theatersWithShows = theaters.filter((theater: ITheater) => 
          cityShows.some((show: IShow) => show.theater_id === theater.id)
        );
        
        return theatersWithShows;
      } catch (error: any) {
        console.error('Помилка отримання театрів міста:', error);
        return [];
      }
    } else {
      try {
        const allTheaters = await customFetch<ITheater[]>('/cities/theaters');
        const allShows = await customFetch<IShow[]>('/shows');
        const upcomingShows = allShows.filter((show: IShow) => new Date(show.datetime) > new Date());
        
        const theatersWithShows = allTheaters.filter((theater: ITheater) => 
          upcomingShows.some((show: IShow) => show.theater_id === theater.id)
        );
        
        return theatersWithShows;
      } catch (error: any) {
        console.error('Помилка отримання всіх театрів:', error);
        return [];
      }
    }
  } catch (error) {
    console.error('Помилка отримання театрів з показами:', error);
    return [];
  }
};

export const getShowsByFilters = async (filters: {
  cityId?: number;
  theaterId?: number;
  performanceId?: number;
}): Promise<IShow[]> => {
  try {
    const params = new URLSearchParams();
    if (filters.cityId) params.append('city_id', filters.cityId.toString());
    if (filters.theaterId) params.append('theater_id', filters.theaterId.toString());
    if (filters.performanceId) params.append('performance_id', filters.performanceId.toString());
    
    const url = `/shows${params.toString() ? `?${params.toString()}` : ''}`;
    return customFetch<IShow[]>(url);
  } catch (error) {
    console.error('Помилка отримання показів з фільтрами:', error);
    throw new Error('Помилка отримання показів з фільтрами');
  }
};

// Функції для завантаження PDF квитків
export const downloadTicketPdf = async (ticketId: number): Promise<void> => {
  try {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`${API_BASE}/tickets/${ticketId}/pdf`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = 'Помилка при завантаженні PDF квитка';
      
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        // Якщо не вдалося розпарсити JSON, використовуємо стандартне повідомлення
        if (errorText.includes('toLocaleDateString')) {
          errorMessage = 'Помилка при обробці дати квитка. Будь ласка, зверніться до підтримки.';
        }
      }
      
      throw new Error(errorMessage);
    }
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = `ticket-${ticketId}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error('Помилка завантаження PDF квитка:', error);
    throw error;
  }
};

export const downloadAllUserTicketsPdf = async (): Promise<void> => {
  try {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`${API_BASE}/tickets/user/pdf`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = 'Помилка при завантаженні PDF усіх квитків';
      
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        // Якщо не вдалося розпарсити JSON, використовуємо стандартне повідомлення
        if (errorText.includes('toLocaleDateString')) {
          errorMessage = 'Помилка при обробці дат квитків. Будь ласка, зверніться до підтримки.';
        }
      }
      
      throw new Error(errorMessage);
    }
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = 'my-tickets.pdf';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error('Помилка завантаження PDF усіх квитків:', error);
    throw error;
  }
};
