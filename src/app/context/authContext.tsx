'use client';

import React, { createContext, useState, useEffect } from 'react';
import { User, LoginCredentials, RegisterCredentials } from '@/app/types/auth';

const API_BASE = '/api';
const AUTH_BASE = '/api/auth';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => Promise<void>;
  admin_login: (credentials: LoginCredentials) => Promise<void>;
  getCurrentUser: () => Promise<User | null>;
  updateUserData: (updatedUser: User) => void;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  admin_login: async () => {},
  getCurrentUser: async () => null,
  updateUserData: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchUserProfile();
    }
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
    await fetchUserProfile();
  };

  const logout = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        console.log('Відправка запиту виходу на:', `${AUTH_BASE}/logout`);
        
        const response = await fetch(`${AUTH_BASE}/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
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
      localStorage.removeItem('token');
      setUser(null);
      setIsAuthenticated(false);
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
      login, 
      register, 
      logout, 
      admin_login,
      getCurrentUser,
      updateUserData
    }}>
      {children}
    </AuthContext.Provider>
  );
}