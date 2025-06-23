export const api = {
  fetch: async (url: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('token');
    
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error('Помилка запиту');
    }

    return response.json();
  }
};

// API utilities та helper функції
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backend-3ih2.onrender.com';

// Функція для очищення URL від подвійних слешів
export const cleanUrl = (url: string): string => {
    return url.replace(/\/+/g, '/').replace(/:\//g, '://');
};

// Функція для створення повного API URL
export const createApiUrl = (endpoint: string): string => {
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const cleanEndpoint = normalizedEndpoint.replace(/\/+/g, '/');
    return cleanUrl(`${API_BASE_URL}${cleanEndpoint}`);
};

// Функція для перевірки доступності API
export const checkApiHealth = async (): Promise<boolean> => {
    try {
        const response = await fetch(createApiUrl('/health'), {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            },
        });
        return response.ok;
    } catch (error) {
        console.error('API health check failed:', error);
        return false;
    }
};

// Логування URL для дебагу
export const logApiRequest = (endpoint: string, method: string = 'GET') => {
    const fullUrl = createApiUrl(endpoint);
    console.log(`[API ${method}]`, fullUrl);
    return fullUrl;
};
