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
    
    const token = localStorage.getItem('token');
    
    const headers = new Headers();
    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }
    
    const config: RequestInit = {
        method: 'GET',
        headers,
        credentials: 'include',
    };
    
    try {
        const response = await fetch(url, config);
        
        if (response.status === 401 && typeof window !== 'undefined') {
            try {
                const { token: newToken } = await refreshToken();
                const newHeaders = new Headers();
                newHeaders.set('Authorization', `Bearer ${newToken}`);
                
                const retryResponse = await fetch(url, {
                    ...config,
                    headers: newHeaders
                });
                
                if (!retryResponse.ok) {
                    throw new Error(`Помилка завантаження файлу: ${retryResponse.status} ${retryResponse.statusText}`);
                }
                
                const blob = await retryResponse.blob();
                downloadBlob(blob, filename);
                return;
            } catch (refreshError) {
                console.error('Помилка оновлення токена:', refreshError);
                throw refreshError;
            }
        }
        
        if (!response.ok) {
            throw new Error(`Помилка завантаження файлу: ${response.status} ${response.statusText}`);
        }
        
        const blob = await response.blob();
        downloadBlob(blob, filename);
    } catch (error) {
        console.error('Повна помилка завантаження файлу:', error);
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
        await downloadFile('/analytics/pdf-report', `analytics-report-${currentDate}.pdf`);
    }
    catch(error){
        console.error('Помилка експорту даних в PDF:', error);
        throw error;
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