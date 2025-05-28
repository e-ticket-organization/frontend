'use client';

import React, { createContext, useState, useEffect, useRef } from 'react';
import { User, LoginCredentials, RegisterCredentials } from '@/app/types/auth';
import { refreshToken as refreshTokenService } from '../services/authService';

const API_BASE = '/api';
const AUTH_BASE = '/api/auth';

const TOKEN_REFRESH_THRESHOLD = 5 * 60 * 1000; // 5 хвилин

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  token: string | null;
  refreshToken: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => Promise<void>;
   admin_login: (credentials: LoginCredentials) => Promise<void>;
  getCurrentUser: () => Promise<User | null>;
  updateUserData: (updatedUser: User) => void;
  refreshAuthToken: () => Promise<string | null>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isAdmin: false,
  token: null,
  refreshToken: null,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  admin_login: async () => {},
  getCurrentUser: async () => null,
  updateUserData: () => {},
  refreshAuthToken: async () => null,
});

const parseJwt = (token: string) => {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (e) {
    return null;
  }
};

const shouldRefreshToken = (token: string | null): boolean => {
  if (!token) return false;
  
  try {
    const decodedToken = parseJwt(token);
    if (!decodedToken || !decodedToken.exp) return false;
    
    const expirationTime = decodedToken.exp * 1000;
    const currentTime = Date.now();
    const timeUntilExpiration = expirationTime - currentTime;
    
    console.log(`Перевірка токена: до закінчення ${Math.round(timeUntilExpiration / 1000 / 60)} хвилин`);
    
    const needsRefresh = timeUntilExpiration > 0 && timeUntilExpiration < TOKEN_REFRESH_THRESHOLD;
    
    if (needsRefresh) {
      console.log('Токен потребує оновлення');
    } else {
      console.log('Токен ще не потребує оновлення');
    }
    
    return needsRefresh;
  } catch (error) {
    console.error('Помилка при перевірці токена:', error);
    return false;
  }
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [refreshTokenState, setRefreshToken] = useState<string | null>(null);
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);

  const refreshAuthToken = async (): Promise<string | null> => {
    try {
      const currentRefreshToken = localStorage.getItem('refreshToken');
      if (!currentRefreshToken) return null;
      
      const { token: newToken, refreshToken: newRefreshToken } = await refreshTokenService();
      
      setToken(newToken);
      setRefreshToken(newRefreshToken);
      
      setupTokenRefreshTimer(newToken);
      
      return newToken;
    } catch (error) {
      console.error('Помилка при оновленні токена:', error);
      logout();
      return null;
    }
  };

  const setupTokenRefreshTimer = (currentToken: string | null) => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
    
    if (!currentToken) return;
    
    try {
      const decodedToken = parseJwt(currentToken);
      if (!decodedToken || !decodedToken.exp) return;
      
      const expirationTime = decodedToken.exp * 1000;
      const currentTime = Date.now();
      const timeUntilRefresh = Math.max(0, expirationTime - currentTime - TOKEN_REFRESH_THRESHOLD);
      
      if (timeUntilRefresh > 0) {
        console.log(`Токен буде оновлено через ${Math.round(timeUntilRefresh / 1000 / 60)} хвилин`);
        refreshTimerRef.current = setTimeout(() => {
          refreshAuthToken();
        }, timeUntilRefresh);
      } else {
        if (shouldRefreshToken(currentToken)) {
          refreshAuthToken();
        }
      }
    } catch (error) {
      console.error('Помилка при налаштуванні таймера оновлення токена:', error);
    }
  };

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedRefreshToken = localStorage.getItem('refreshToken');
    
    if (storedToken) {
      console.log('Знайдено збережений токен при завантаженні');
      setToken(storedToken);
      setRefreshToken(storedRefreshToken);
      fetchUserProfile();
      
      if (shouldRefreshToken(storedToken)) {
        console.log('Токен потребує оновлення при завантаженні');
        refreshAuthToken();
      } else {
        console.log('Токен ще дійсний, налаштовуємо таймер');
        setupTokenRefreshTimer(storedToken);
      }
    } else {
      console.log('Збережений токен не знайдено');
    }
    
    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, []);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${API_BASE}/users/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Не вдалося отримати профіль користувача');
      }

      const userData = await response.json();
      setUser(userData);
      setIsAuthenticated(true);
      setIsAdmin(userData.status === 'admin');
    } catch (error) {
      console.error('Error fetching user profile:', error);
      logout();
    }
  };

  const login = async (credentials: LoginCredentials) => {
    console.log('Відправка запиту авторизації на:', `${AUTH_BASE}/login`);
    
    const response = await fetch(`${AUTH_BASE}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(credentials),
      credentials: 'include'
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Невірний email або пароль');
    }

    const data = await response.json();
    localStorage.setItem('token', data.token);
    localStorage.setItem('refreshToken', data.refreshToken);
    setToken(data.token);
    setRefreshToken(data.refreshToken);
    setIsAdmin(data.is_admin || false);
    await fetchUserProfile();
    
    setupTokenRefreshTimer(data.token);
  };

  const register = async (credentials: RegisterCredentials) => {
    console.log('Відправка запиту реєстрації на:', `${AUTH_BASE}/register`);
    
    const response = await fetch(`${AUTH_BASE}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(credentials),
      credentials: 'include'
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Помилка реєстрації');
    }

    const data = await response.json();
    localStorage.setItem('token', data.token);
    localStorage.setItem('refreshToken', data.refreshToken);
    setToken(data.token);
    setRefreshToken(data.refreshToken);
    await fetchUserProfile();
    
    setupTokenRefreshTimer(data.token);
  };

  const logout = async () => {
    try {
      const currentToken = localStorage.getItem('token');
      if (currentToken) {
        console.log('Відправка запиту виходу на:', `${AUTH_BASE}/logout`);
        
        const response = await fetch(`${AUTH_BASE}/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${currentToken}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });
        
        if (!response.ok) {
          console.error('Помилка при виході');
        }
      }
    } catch (error) {
      console.error('Помилка при виході:', error);
    } finally {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
      
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      setToken(null);
      setRefreshToken(null);
      setUser(null);
      setIsAuthenticated(false);
      setIsAdmin(false);
    }
  };

  const admin_login = async (credentials: LoginCredentials) => {
    const response = await fetch('https://backend-3ih2.onrender.com/api/auth/login/admin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(credentials)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Невірні облікові дані адміністратора');
    }

    const data = await response.json();

    // Зберігаємо токен і статус адміністратора
    localStorage.setItem('token', data.token);
    setToken(data.token);
    setIsAdmin(data.is_admin || false);
    setUser(data.user);
    setIsAuthenticated(true);

    // Можна зберігати refreshToken, якщо він є
    if (data.refreshToken) {
      localStorage.setItem('refreshToken', data.refreshToken);
      setRefreshToken(data.refreshToken);
    }
    
    setupTokenRefreshTimer(data.token);
  };

  // Публічний метод для отримання поточного користувача з кешуванням
  const getCurrentUser = async (): Promise<User | null> => {
    // Якщо користувач вже завантажений, повертаємо його
    if (user) {
      return user;
    }
    
    // Інакше завантажуємо профіль
    try {
      await fetchUserProfile();
      return user;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  };

  const updateUserData = (updatedUser: User) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      isAdmin,
      token,
      refreshToken: refreshTokenState,
      login, 
      register, 
      logout, 
      admin_login,
      getCurrentUser,
      updateUserData,
      refreshAuthToken
    }}>
      {children}
    </AuthContext.Provider>
  );
}