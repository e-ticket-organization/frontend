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

async function downloadFile(endpoint: string, filename: string, timeout: number = 60000): Promise<void> {
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const cleanEndpoint = normalizedEndpoint.replace(/\/+$/, '');
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
            const errorText = await response.text();
            console.error('Текст помилки відповіді:', errorText);
            console.error('Помилка статусу:', response.status, response.statusText);
            
            if (response.status === 502) {
                console.error('Помилка 502 - Bad Gateway. Можливі причини:');
                console.error('1. Сервер недоступний або перевантажений');
                console.error('2. Проблема з PDF генерацією на сервері');
                console.error('3. Тайм-аут при створенні PDF файлу');
                console.error('4. Помилка конфігурації веб-сервера або проксі (Netlify)');
                console.error('5. URL містить подвійні слеші або некоректний маршрут');
                
                throw new Error(`Сервер тимчасово недоступний (502). Спробуйте знову через кілька хвилин або використайте альтернативний формат експорту.`);
            }
            
            throw new Error(`Помилка завантаження файлу: ${response.status} ${response.statusText} - ${errorText}`);
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
    const maxRetries = 3;
    const retryDelay = 3000; // 3 секунди між спробами
    const pdfTimeout = 120000; // 2 хвилини для PDF генерації
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`Спроба PDF експорту #${attempt}/${maxRetries}...`);
            const currentDate = new Date().toISOString().split('T')[0];
            console.log('Дата для файлу:', currentDate);
            console.log('URL для PDF запиту: /api/analytics/pdf-report');
            console.log('Таймаут для PDF:', pdfTimeout, 'мс');
            
            // Збільшений таймаут для PDF (2 хвилини)
            await downloadFile('/analytics/pdf-report', `analytics-report-${currentDate}.pdf`, pdfTimeout);
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
            
            // Якщо це помилка 502, таймаут або серверна помилка і не остання спроба - чекаємо та повторюємо
            if (error instanceof Error && 
                (error.message.includes('502') || 
                 error.message.includes('таймаут') || 
                 error.message.includes('Таймаут') ||
                 error.message.includes('недоступний')) && 
                attempt < maxRetries) {
                console.log(`Серверна помилка detected. Очікування ${retryDelay/1000} секунд перед наступною спробою...`);
                await new Promise(resolve => setTimeout(resolve, retryDelay));
                continue;
            }
            
            // Якщо всі спроби вичерпані - кидаємо помилку з додатковою інформацією
            if (attempt === maxRetries) {
                console.error('Всі спроби PDF експорту вичерпані');
                
                // Додаємо спеціальне повідомлення для різних типів помилок
                let enhancedMessage = `Помилка PDF експорту після ${maxRetries} спроб: ${error instanceof Error ? error.message : String(error)}`;
                
                if (error instanceof Error) {
                    if (error.message.includes('502')) {
                        enhancedMessage += '\n\nРекомендації:\n• Спробуйте знову через 5-10 хвилин\n• Використайте Excel або CSV формат\n• Перевірте стабільність інтернет-з\'єднання';
                    } else if (error.message.includes('таймаут') || error.message.includes('Таймаут')) {
                        enhancedMessage += '\n\nПроблема з таймаутом:\n• Сервер занадто довго генерує PDF\n• Спробуйте експорт у менш навантажений час\n• Використайте альтернативні формати (Excel/CSV)';
                    }
                }
                
                throw new Error(enhancedMessage);
            } else {
                // Кидаємо помилку для не-серверних помилок (наприклад, проблеми з мережею)
                throw error;
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
        console.error('Помилка експорту daних в CSV:', error);
        throw error;
    }
}

// Альтернативний метод PDF експорту через base64
export const exportPdfDataBase64 = async (): Promise<void> => {
    try {
        console.log('Початок PDF експорту через base64...');
        const currentDate = new Date().toISOString().split('T')[0];
        const filename = `analytics-report-${currentDate}.pdf`;
        
        // Запит на base64 PDF
        const response = await customFetch<{
            success: boolean;
            data?: string;
            filename?: string;
            message?: string;
        }>('/analytics/pdf-base64');
        
        if (!response.success || !response.data) {
            throw new Error(response.message || 'Помилка отримання PDF у base64 форматі');
        }
        
        console.log('Отримано base64 дані, розмір:', response.data.length);
        
        // Конвертуємо base64 в blob
        const byteCharacters = atob(response.data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });
        
        console.log('PDF blob створено, розмір:', blob.size);
        
        // Завантажуємо файл
        const finalFilename = response.filename || filename;
        downloadBlob(blob, finalFilename);
        
        console.log('PDF експорт через base64 завершено успішно');
    } catch (error) {
        console.error('Помилка PDF експорту через base64:', error);
        throw error;
    }
}

// Перевірка здоров'я PDF сервісу
export const checkPdfHealth = async (): Promise<boolean> => {
    try {
        console.log('Перевірка здоров\'я PDF сервісу...');
        const response = await customFetch<{
            status: string;
            pdf_service: boolean;
            message?: string;
        }>('/analytics/health');
        
        const isHealthy = response.status === 'healthy' && response.pdf_service === true;
        console.log('Стан PDF сервісу:', isHealthy ? 'здоровий' : 'недоступний', response);
        
        return isHealthy;
    } catch (error) {
        console.error('Помилка перевірки здоров\'я PDF сервісу:', error);
        return false;
    }
}