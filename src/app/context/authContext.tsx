'use client';

import React, { createContext, useState, useEffect } from 'react';
import { User, LoginCredentials, RegisterCredentials } from '@/app/types/auth';
import axios from 'axios';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => Promise<void>;
  admin_login: (credentials: LoginCredentials) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  admin_login: async () => {},
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
      const url = `${process.env.NEXT_PUBLIC_API_URL}/auth/login`;
      console.log('Fetching user profile from:', url);
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch user profile');
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
    const response = await fetch(`https://backend-3ih2.onrender.com/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      throw new Error('Невірний email або пароль');
    }

    const data = await response.json();
    localStorage.setItem('token', data.token);
    await fetchUserProfile();
  };

  const register = async (credentials: RegisterCredentials) => {
    if (!process.env.NEXT_PUBLIC_AUTH_URL) {
      throw new Error('AUTH_URL не визначено. Перевірте налаштування змінних середовища.');
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_AUTH_URL}register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      throw new Error('Помилка реєстрації');
    }

    const data = await response.json();
    localStorage.setItem('token', data.token);
    await fetchUserProfile();
  };

  const logout = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const response = await fetch(`${process.env.NEXT_PUBLIC_AUTH_URL}logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
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
    const response = await fetch(`${process.env.NEXT_PUBLIC_AUTH_URL}login/admin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      throw new Error('Невірні облікові дані адміністратора');
    }

    const data = await response.json();
    localStorage.setItem('token', data.token);
    await fetchUserProfile();
  };

  const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_AUTH_URL,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  });

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, register, logout, admin_login }}>
      {children}
    </AuthContext.Provider>
  );
}