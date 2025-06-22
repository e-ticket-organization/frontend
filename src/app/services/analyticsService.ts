import { NewsletterStats, AnalyticsData, DashboardData } from '../types/analytics';
import { refreshToken, getUser } from './authService';

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

async function downloadFile(endpoint: string, filename: string): Promise<void> {
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${API_BASE}${normalizedEndpoint}`;
    
    console.log('Завантаження файлу з URL:', url);
    console.log('Ім\'я файлу:', filename);
    
    const token = localStorage.getItem('token');
    console.log('Токен присутній:', !!token);
    
    const headers = new Headers();
    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }
    
    const config: RequestInit = {
        method: 'GET',
        headers,
        credentials: 'include',
    };
    
    console.log('Конфігурація запиту:', {
        method: config.method,
        url: url,
        headers: Object.fromEntries(headers.entries()),
        credentials: config.credentials
    });
    
    try {
        console.log('Виконується запит...');
        const response = await fetch(url, config);
        
        console.log('Отримано відповідь:', {
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries()),
            ok: response.ok
        });
        
        if (response.status === 401 && typeof window !== 'undefined') {
            console.log('Спроба оновлення токена...');
            try {
                const { token: newToken } = await refreshToken();
                const newHeaders = new Headers();
                newHeaders.set('Authorization', `Bearer ${newToken}`);
                
                console.log('Повторний запит з новим токеном...');
                const retryResponse = await fetch(url, {
                    ...config,
                    headers: newHeaders
                });
                
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
                console.error('Помилка оновлення токена:', refreshError);
                throw refreshError;
            }
        }
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Текст помилки відповіді:', errorText);
            console.error('Помилка статусу:', response.status, response.statusText);
            
            // Спеціальна обробка для помилки 502
            if (response.status === 502) {
                console.error('Помилка 502 - Bad Gateway. Можливі причини:');
                console.error('1. Сервер недоступний або перевантажений');
                console.error('2. Проблема з PDF генерацією на сервері');
                console.error('3. Тайм-аут при створенні PDF файлу');
                console.error('4. Помилка конфігурації веб-сервера');
            }
            
            throw new Error(`Помилка завантаження файлу: ${response.status} ${response.statusText} - ${errorText}`);
        }
        
        const blob = await response.blob();
        console.log('Blob створено успішно, розмір:', blob.size, 'тип:', blob.type);
        downloadBlob(blob, filename);
        console.log('Файл завантажено успішно');
    } catch (error) {
        console.error('Повна помилка завантаження файлу:', error);
        console.error('Тип помилки:', error instanceof Error ? error.constructor.name : typeof error);
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
    const maxRetries = 3;
    const retryDelay = 2000; // 2 секунди між спробами
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`Спроба PDF експорту #${attempt}/${maxRetries}...`);
            const currentDate = new Date().toISOString().split('T')[0];
            console.log('Дата для файлу:', currentDate);
            console.log('URL для PDF запиту: /api/analytics/pdf-report');
            
            await downloadFile('/analytics/pdf-report', `analytics-report-${currentDate}.pdf`);
            console.log('PDF експорт завершено успішно');
            return; // Успішний експорт - виходимо з функції
        }
        catch(error){
            console.error(`Помилка експорту даних в PDF (спроба ${attempt}/${maxRetries}):`, error);
            console.error('Деталі помилки PDF експорту:', {
                attempt: attempt,
                name: error instanceof Error ? error.name : 'Unknown',
                message: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined
            });
            
            // Якщо це помилка 502 і не остання спроба - чекаємо та повторюємо
            if (error instanceof Error && 
                error.message.includes('502') && 
                attempt < maxRetries) {
                console.log(`Помилка 502 detected. Очікування ${retryDelay/1000} секунд перед наступною спробою...`);
                await new Promise(resolve => setTimeout(resolve, retryDelay));
                continue;
            }
            
            // Якщо всі спроби вичерпані або це не 502 помилка - кидаємо помилку
            if (attempt === maxRetries) {
                console.error('Всі спроби PDF експорту вичерпані');
                throw new Error(`Помилка PDF експорту після ${maxRetries} спроб: ${error instanceof Error ? error.message : String(error)}`);
            } else {
                throw error; // Кидаємо помилку для не-502 помилок
            }
        }
    }
}

export const exportCsvData = async (): Promise<void> => {
    try {
        const currentDate = new Date().toISOString().split('T')[0];
        await downloadFile('/analytics/csv-report', `analytics-report-${currentDate}.csv`);
    }
    catch(error){
        console.error('Помилка експорту даних в CSV:', error);
        throw error;
    }
}