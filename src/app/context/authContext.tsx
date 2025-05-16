'use client';

import React, { createContext, useState, useEffect, useRef } from 'react';
import { User, LoginCredentials, RegisterCredentials } from '@/app/types/auth';
import { refreshToken as refreshTokenService } from '../services/authService';

const API_BASE = '/api';
const AUTH_BASE = '/api/auth';

const TOKEN_REFRESH_THRESHOLD = 60 * 60 * 1000;

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
    
    return expirationTime - currentTime < TOKEN_REFRESH_THRESHOLD;
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
        console.log(`Токен буде оновлено через ${timeUntilRefresh / 1000} секунд`);
        refreshTimerRef.current = setTimeout(() => {
          refreshAuthToken();
        }, timeUntilRefresh);
      } else {
        refreshAuthToken();
      }
    } catch (error) {
      console.error('Помилка при налаштуванні таймера оновлення токена:', error);
    }
  };

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedRefreshToken = localStorage.getItem('refreshToken');
    
    if (storedToken) {
      setToken(storedToken);
      setRefreshToken(storedRefreshToken);
      fetchUserProfile();
      
      if (shouldRefreshToken(storedToken)) {
        refreshAuthToken();
      } else {
        setupTokenRefreshTimer(storedToken);
      }
    }
    
    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (token) {
      setupTokenRefreshTimer(token);
    }
  }, [token]);

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
    console.log('Відправка запиту авторизації адміна на:', `${AUTH_BASE}/admin/login`);
    
    const response = await fetch(`${AUTH_BASE}/admin/login`, {
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
      throw new Error(errorData.message || 'Невірні облікові дані адміністратора');
    }

    const data = await response.json();
    localStorage.setItem('token', data.token);
    localStorage.setItem('refreshToken', data.refreshToken);
    setToken(data.token);
    setRefreshToken(data.refreshToken);
    setIsAdmin(true);
    await fetchUserProfile();
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