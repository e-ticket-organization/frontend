import { LoginCredentials, RegisterCredentials, User } from '@/app/types/auth';

const API_BASE = '/api';
const AUTH_BASE = '/api/auth';

interface LoginResponse {
  token: string;
  user: User;
}

interface RefreshResponse {
  token: string;
}

interface RegisterData {
    name: string;
    email: string;
    phoneNumbers: string;
    age: number;
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
        age: number;
    };
    token: string;
    message: string;
}

async function customFetch(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem('token');
  
  const headers = new Headers(options.headers);
  
  headers.set('Content-Type', 'application/json');
  headers.set('Accept', 'application/json');
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
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
      const newToken = await refreshToken();
      
      const newHeaders = new Headers(headers);
      newHeaders.set('Authorization', `Bearer ${newToken}`);
      
      return fetch(url, {
        ...config,
        headers: newHeaders
      }).then(res => res.json());
    } catch (error) {
      const user = getUser();
      if (user?.status === 'admin') {
        window.location.href = '/admin/login';
      } else {
        window.location.href = '/';
      }
      throw error;
    }
  }
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Помилка запиту');
  }
  
  return response.json();
}

export const login = async (credentials: LoginCredentials): Promise<LoginResponse> => {
  try {
    const data = await customFetch(`${AUTH_BASE}/login`, {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
    
    const { token, user } = data;
    
    localStorage.setItem('token', token);
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
    
    const { token, user } = data;
    
    localStorage.setItem('token', token);
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
    
    const { token, user } = data;
    
    localStorage.setItem('token', token);
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
    localStorage.removeItem('user');
  }
};

export const getToken = (): string | null => {
  return localStorage.getItem('token');
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

export const refreshToken = async (): Promise<string> => {
  try {
    const headers = new Headers();
    headers.set('Content-Type', 'application/json');
    headers.set('Accept', 'application/json');
    
    const response = await fetch(`${AUTH_BASE}/refresh`, {
      method: 'POST',
      headers,
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error('Не вдалося оновити токен');
    }
    
    const data = await response.json();
    const { token } = data;
    localStorage.setItem('token', token);
    return token;
  } catch (error) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    throw error;
  }
};

export const registerUser = async (registerData: RegisterData): Promise<RegisterResponse> => {
  try {
    const data = await customFetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      body: JSON.stringify(registerData)
    });
    
    localStorage.setItem('token', data.token);
    
    console.log('Реєстрація успішна:', data.message);
    return data;
  } catch (error: any) {
    console.error('Помилка реєстрації:', error);
    throw new Error(error.message || 'Помилка при реєстрації');
  }
};