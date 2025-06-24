import { LoginCredentials, RegisterCredentials, User } from '@/app/types/auth';

const API_BASE = '/api';
const AUTH_BASE = '/api/auth';

interface LoginResponse {
  token: string;
  refreshToken: string;
  user: User;
  message: string;
  is_admin: boolean;
}

interface RefreshResponse {
  token: string;
  refreshToken: string;
}

interface RegisterData {
    name: string;
    email: string;
    phoneNumbers: string;
    dateOfBirth: string;
    password: string;
    password_confirmation: string;
}

interface RegisterResponse {
    user: {
        id: number;
        name: string;
        email: string;
        status: string;
        phoneNumbers: string;
        dateOfBirth: string;
    };
    token: string;
    refreshToken: string;
    message: string;
}

// Декодування JWT токена
export const parseJwt = (token: string) => {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (e) {
    return null;
  }
};

// Перевірка закінчення строку дії токена
export const isTokenExpired = (token: string): boolean => {
  try {
    const decodedToken = parseJwt(token);
    if (!decodedToken || !decodedToken.exp) return true;
    
    // Отримуємо час закінчення дії токена в мс
    const expirationTime = decodedToken.exp * 1000;
    // Поточний час
    const currentTime = Date.now();
    
    return currentTime >= expirationTime;
  } catch (error) {
    console.error('Помилка перевірки токена:', error);
    return true;
  }
};

// Отримання залишкового часу дії токена в мілісекундах
export const getTokenRemainingTime = (token: string): number => {
  try {
    const decodedToken = parseJwt(token);
    if (!decodedToken || !decodedToken.exp) return 0;
    
    const expirationTime = decodedToken.exp * 1000;
    const currentTime = Date.now();
    
    return Math.max(0, expirationTime - currentTime);
  } catch (error) {
    console.error('Помилка отримання часу дії токена:', error);
    return 0;
  }
};

async function customFetch(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem('token');
  
  const headers = new Headers(options.headers);
  
  headers.set('Content-Type', 'application/json');
  headers.set('Accept', 'application/json');
  
  if (token) {
    // Перевіряємо, чи токен дійсно закінчився (а не просто близький до закінчення)
    if (isTokenExpired(token)) {
      try {
        const { token: newToken } = await refreshToken();
        headers.set('Authorization', `Bearer ${newToken}`);
      } catch (error) {
        // Якщо не вдалося оновити токен, перенаправляємо на сторінку входу
        redirectToLogin();
        throw new Error('Сесія закінчилася. Будь ласка, увійдіть знову.');
      }
    } else {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }
  
  const config: RequestInit = {
    ...options,
    headers,
    credentials: 'include'
  };
  
  console.log('Відправка запиту до:', url, config);
  
  const response = await fetch(url, config);
  
  if (response.status === 401) {
    try {
      const { token: newToken } = await refreshToken();
      
      const newHeaders = new Headers(headers);
      newHeaders.set('Authorization', `Bearer ${newToken}`);
      
      return fetch(url, {
        ...config,
        headers: newHeaders
      }).then(res => res.json());
    } catch (error) {
      redirectToLogin();
      throw error;
    }
  }
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Помилка запиту');
  }
  
  return response.json();
}

// Функція для перенаправлення на відповідну сторінку входу
const redirectToLogin = () => {
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
};

export const login = async (credentials: LoginCredentials): Promise<LoginResponse> => {
  try {
    const data = await customFetch(`${AUTH_BASE}/login`, {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
    
    const { token, refreshToken, user } = data;
    
    localStorage.setItem('token', token);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(user));
    
    return data;
  } catch (error: any) {
    throw new Error(error.message || 'Помилка авторизації');
  }
};

export const admin_login = async (credentials: LoginCredentials): Promise<LoginResponse> => {
  try {
    const data = await customFetch(`${AUTH_BASE}/admin/login`, {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
    
    const { token, refreshToken, user } = data;
    
    localStorage.setItem('token', token);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(user));
    
    return data;
  } catch (error: any) {
    throw new Error(error.message || 'Помилка авторизації');
  }
};

export const register = async (credentials: RegisterCredentials): Promise<LoginResponse> => {
  try {
    const data = await customFetch(`${AUTH_BASE}/register`, {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
    
    const { token, refreshToken, user } = data;
    
    localStorage.setItem('token', token);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(user));
    
    return data;
  } catch (error: any) {
    throw new Error(error.message || 'Помилка реєстрації');
  }
};

export const logout = async (): Promise<void> => {
  try {
    await customFetch(`${AUTH_BASE}/logout`, {
      method: 'POST'
    });
  } finally {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }
};

export const getToken = (): string | null => {
  return localStorage.getItem('token');
};

export const getRefreshToken = (): string | null => {
  return localStorage.getItem('refreshToken');
};

export const getUser = (): User | null => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

export const fetchUserProfile = async (): Promise<User> => {
  try {
    const user = await customFetch(`${API_BASE}/user`);
    localStorage.setItem('user', JSON.stringify(user));
    return user;
  } catch (error: any) {
    throw new Error(error.message || 'Помилка отримання профілю');
  }
};

export const refreshToken = async (): Promise<RefreshResponse> => {
  try {
    const headers = new Headers();
    headers.set('Content-Type', 'application/json');
    headers.set('Accept', 'application/json');
    
    const currentRefreshToken = localStorage.getItem('refreshToken');
    
    if (!currentRefreshToken) {
      throw new Error('Відсутній refresh token');
    }
    
    const response = await fetch(`${AUTH_BASE}/refresh`, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify({ refreshToken: currentRefreshToken })
    });
    
    if (!response.ok) {
      throw new Error('Не вдалося оновити токен');
    }
    
    const data = await response.json();
    const { token, refreshToken: newRefreshToken } = data;
    
    // Зберігаємо нові токени
    localStorage.setItem('token', token);
    localStorage.setItem('refreshToken', newRefreshToken || currentRefreshToken);
    
    console.log('Токен успішно оновлено');
    
    return { 
      token, 
      refreshToken: newRefreshToken || currentRefreshToken 
    };
  } catch (error) {
    console.error('Помилка оновлення токену:', error);
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    throw error;
  }
};

export const checkAndRefreshToken = async (): Promise<string | null> => {
  try {
    const currentToken = localStorage.getItem('token');
    
    if (!currentToken) return null;
    
    if (isTokenExpired(currentToken) || getTokenRemainingTime(currentToken) < 5 * 60 * 1000) {
      console.log('Токен закінчується або вже закінчився, оновлюємо...');
      const { token: newToken } = await refreshToken();
      return newToken;
    }
    
    return currentToken;
  } catch (error) {
    console.error('Помилка при перевірці та оновленні токена:', error);
    redirectToLogin();
    return null;
  }
};

export const registerUser = async (registerData: RegisterData): Promise<RegisterResponse> => {
  try {
    const data = await customFetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      body: JSON.stringify(registerData)
    });
    
    localStorage.setItem('token', data.token);
    localStorage.setItem('refreshToken', data.refreshToken);
    
    console.log('Реєстрація успішна:', data.message);
    return data;
  } catch (error: any) {
    console.error('Помилка реєстрації:', error);
    throw new Error(error.message || 'Помилка при реєстрації');
  }
};

export const requestPasswordReset = async (email: string): Promise<{ message: string }> => {
  try {
    const data = await customFetch(`${AUTH_BASE}/forgot-password`, {
      method: 'POST',
      body: JSON.stringify({ email })
    });
    
    return data;
  } catch (error: any) {
    throw new Error(error.message || 'Помилка при відправленні запиту на відновлення паролю');
  }
};

export const resetPassword = async (token: string, password: string, passwordConfirmation: string): Promise<{ message: string }> => {
  try {
    const data = await customFetch(`${AUTH_BASE}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ token, password, passwordConfirmation })
    });
    
    return data;
  } catch (error: any) {
    throw new Error(error.message || 'Помилка при зміні паролю');
  }
};