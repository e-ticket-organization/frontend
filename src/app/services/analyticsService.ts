import { NewsletterStats, AnalyticsData, DashboardData } from '../types/analytics';
import { refreshToken, getUser } from './authService';

const API_BASE = '/api';

async function customFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    // Видаляємо подвійні слеші з URL
    const cleanEndpoint = normalizedEndpoint.replace(/\/+/g, '/');
    const url = `${API_BASE}${cleanEndpoint}`;
    
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

async function downloadFile(endpoint: string, filename: string, timeout: number = 60000): Promise<void> {
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    // Видаляємо подвійні слеші та зайві слеші в кінці
    const cleanEndpoint = normalizedEndpoint.replace(/\/+/g, '/').replace(/\/+$/, '');
    const url = `${API_BASE}${cleanEndpoint}`;
    
    console.log('Завантаження файлу з URL:', url);
    console.log('Ім\'я файлу:', filename);
    console.log('Таймаут:', timeout, 'мс');
    
    const token = localStorage.getItem('token');
    console.log('Токен присутній:', !!token);
    
    const headers = new Headers();
    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }
    headers.set('Accept', 'application/octet-stream, application/pdf, */*');
    
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), timeout);
    
    const config: RequestInit = {
        method: 'GET',
        headers,
        credentials: 'include',
        signal: abortController.signal
    };
    
    console.log('Конфігурація запиту:', {
        method: config.method,
        url: url,
        headers: Object.fromEntries(headers.entries()),
        credentials: config.credentials,
        timeout: timeout
    });
    
    try {
        console.log('Виконується запит...');
        const response = await fetch(url, config);
        
        clearTimeout(timeoutId);
        
        console.log('Отримано відповідь:', {
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries()),
            ok: response.ok,
            type: response.type,
            url: response.url
        });
        
        if (response.status === 401 && typeof window !== 'undefined') {
            console.log('Спроба оновлення токена...');
            try {
                const { token: newToken } = await refreshToken();
                const newHeaders = new Headers();
                newHeaders.set('Authorization', `Bearer ${newToken}`);
                newHeaders.set('Accept', 'application/octet-stream, application/pdf, */*');
                
                const retryAbortController = new AbortController();
                const retryTimeoutId = setTimeout(() => retryAbortController.abort(), timeout);
                
                console.log('Повторний запит з новим токеном...');
                const retryResponse = await fetch(url, {
                    ...config,
                    headers: newHeaders,
                    signal: retryAbortController.signal
                });
                
                clearTimeout(retryTimeoutId);
                
                console.log('Відповідь після оновлення токена:', {
                    status: retryResponse.status,
                    statusText: retryResponse.statusText,
                    ok: retryResponse.ok
                });
                
                if (!retryResponse.ok) {
                    const errorText = await retryResponse.text();
                    console.error('Текст помилки після оновлення токена:', errorText);
                    throw new Error(`Помилка завантаження файлу: ${retryResponse.status} ${retryResponse.statusText} - ${errorText}`);
                }
                
                const blob = await retryResponse.blob();
                console.log('Blob створено, розмір:', blob.size, 'тип:', blob.type);
                downloadBlob(blob, filename);
                return;
            } catch (refreshError) {
                clearTimeout(timeoutId);
                console.error('Помилка оновлення токена:', refreshError);
                throw refreshError;
            }
        }
        
        if (!response.ok) {
            let errorText = '';
            let errorData = null;
            
            try {
                errorText = await response.text();
                console.error('Текст помилки відповіді:', errorText);
                
                // Спробуємо розпарсити JSON помилку
                try {
                    errorData = JSON.parse(errorText);
                } catch (jsonError) {
                    // Якщо не JSON, використовуємо текст як є
                }
            } catch (textError) {
                console.error('Не вдалося прочитати текст помилки:', textError);
                errorText = `Помилка читання відповіді сервера`;
            }
            
            console.error('Помилка статусу:', response.status, response.statusText);
            
            // Обробляємо різні типи серверних помилок
            if (response.status === 502) {
                console.error('Помилка 502 - Bad Gateway. Можливі причини:');
                console.error('1. Сервер недоступний або перевантажений');
                console.error('2. Проблема з PDF генерацією на сервері');
                console.error('3. Тайм-аут при створенні PDF файлу');
                console.error('4. Помилка конфігурації веб-сервера або проксі (Netlify)');
                console.error('5. URL містить подвійні слеші або некоректний маршрут');
                
                throw new Error(`Сервер тимчасово недоступний (502). Спробуйте знову через кілька хвилин або використайте альтернативний формат експорту.`);
            } else if (response.status === 500) {
                console.error('Помилка 500 - Internal Server Error. Можливі причини:');
                console.error('1. Помилка в коді сервера під час генерації PDF');
                console.error('2. Проблеми з базою даних');
                console.error('3. Недостатньо пам\'яті для генерації великого PDF');
                
                const serverMessage = errorData?.message || errorData?.error || errorText;
                throw new Error(`Внутрішня помилка сервера (500): ${serverMessage}. Спробуйте знову пізніше.`);
            } else if (response.status === 503) {
                console.error('Помилка 503 - Service Unavailable');
                throw new Error(`Сервіс тимчасово недоступний (503). Спробуйте знову через кілька хвилин.`);
            } else if (response.status === 504) {
                console.error('Помилка 504 - Gateway Timeout');
                throw new Error(`Таймаут сервера (504). PDF генерація займає занадто багато часу. Спробуйте знову пізніше.`);
            }
            
            // Загальна обробка помилок
            const serverMessage = errorData?.message || errorData?.error || errorText;
            throw new Error(`Помилка завантаження файлу (${response.status}): ${serverMessage || response.statusText}`);
        }
        
        const blob = await response.blob();
        console.log('Blob створено успішно, розмір:', blob.size, 'тип:', blob.type);
        
        if (filename.endsWith('.pdf') && blob.type && !blob.type.includes('pdf') && blob.size < 1000) {
            console.warn('Отримано замало данних або неправильний тип для PDF:', blob.type, blob.size);
            const text = await blob.text();
            console.error('Вміст відповіді:', text);
            throw new Error('Отримано некоректний PDF файл від сервера');
        }
        
        downloadBlob(blob, filename);
        console.log('Файл завантажено успішно');
    } catch (error) {
        clearTimeout(timeoutId);
        console.error('Повна помилка завантаження файлу:', error);
        console.error('Тип помилки:', error instanceof Error ? error.constructor.name : typeof error);
        
        if (error instanceof Error && error.name === 'AbortError') {
            throw new Error(`Таймаут запиту (${timeout/1000}с). Сервер не встиг обробити запит. Спробуйте знову або використайте альтернативний формат.`);
        }
        
        throw error;
    }
}

function downloadBlob(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
}

export const getNewsletterStats = async (): Promise<NewsletterStats> => {
  try {
    return await customFetch<NewsletterStats>('/newsletter/stats');
  } catch (error) {
    console.error('Помилка отримання статистики розсилки:', error);
    throw error;
  }
};

export const getAnalytics = async (): Promise<AnalyticsData> => {
  try {
    return await customFetch<AnalyticsData>('/analytics');
  } catch (error) {
    console.error('Помилка отримання аналітичних даних:', error);
    throw error;
  }
};

export const getDashboardAnalytics = async (): Promise<DashboardData> => {
  try {
    return await customFetch<DashboardData>('/analytics/dashboard');
  } catch (error) {
    console.error('Помилка отримання даних дашборду:', error);
    throw error;
  }
}; 

export const exportExcelData = async (): Promise<void> => {
  try {
    const currentDate = new Date().toISOString().split('T')[0];
    await downloadFile('/analytics/excel-report', `analytics-report-${currentDate}.xlsx`);
  } catch (error) {
    console.error('Помилка експорту даних в Excel:', error);
    throw error;
  }
};

export const exportPdfData = async (): Promise<void> => {
    try {
        const currentDate = new Date().toISOString().split('T')[0];
        // Збільшуємо таймаут до 2 хвилин для PDF генерації
        await downloadFile('/analytics/pdf-report', `analytics-report-${currentDate}.pdf`, 120000);
    } catch (error) {
        console.error('Помилка експорту даних в PDF:', error);
        throw new Error(`Помилка PDF експорту: ${error instanceof Error ? error.message : 'Невідома помилка'}`);
    }
};

export const testApiConnection = async (): Promise<{ status: string; message: string }> => {
    try {
        const response = await customFetch<{ status: string; message: string }>('/analytics/test');
        return response;
    } catch (error) {
        console.error('Помилка тестування API:', error);
        return {
            status: 'error',
            message: error instanceof Error ? error.message : 'Невідома помилка'
        };
    }
};

export const exportCsvData = async (): Promise<void> => {
    try {
        const currentDate = new Date().toISOString().split('T')[0];
        await downloadFile('/analytics/csv-report', `analytics-report-${currentDate}.csv`);
    }
    catch(error){
        console.error('Помилка експорту daних в CSV:', error);
        throw error;
    }
}

