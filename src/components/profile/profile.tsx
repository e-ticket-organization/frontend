'use client';

import React, { useState, useEffect } from 'react';
import './profile.styles.css';
import { getUserProfile, updateUserProfile } from '@/app/services/filmService';
import { IUser } from '@/app/types/user';
import { useRouter } from 'next/dist/client/components/navigation';


export default function Profile() {
  const [userData, setUserData] = useState<IUser>({
    id: 0,
    name: '',
    email: '',
    password: '',
    phone_numbers: '',
    age: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [originalData, setOriginalData] = useState<IUser | null>(null);

  useEffect(() => {
    fetchUserData();
  }, []);
  const router = useRouter();

  const handleNavigation = (path: string) => {
    router.push(path);
  }; 
  const fetchUserData = async () => {
    try {
      setIsLoading(true);
      const response = await getUserProfile();
      const user = response;
      
      if (!user) {
        throw new Error('Дані користувача не отримано');
      }
         
      const userData = {
        id: user.id,
        name: user.name || '',
        email: user.email || '',
        password: '',
        phone_numbers: user.phone_numbers || '',
        age: user.age?.toString() || ''
      };
      
      setUserData(userData);
      setOriginalData(userData);
      setError(null);
    } catch (err: any) {
      setError('Помилка при завантаженні даних користувача');
      console.error('Помилка завантаження:', err);
      if (err?.response?.status === 401) {
        window.location.href = '/login';
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setError(null);
      
      const updateData: Partial<IUser> = {};
      
      console.log('Порівняння phone_numbers:', {
        current: userData.phone_numbers,
        original: originalData?.phone_numbers
      });

      if (userData.name !== originalData?.name && userData.name.trim()) {
        updateData.name = userData.name;
      }
      if (userData.phone_numbers !== originalData?.phone_numbers && userData.phone_numbers?.trim()) {
        updateData.phone_numbers = userData.phone_numbers;
      }
      if (userData.age !== originalData?.age && userData.age) {
        updateData.age = userData.age;
      }
      if (userData.email !== originalData?.email && userData.email.trim()) {
        updateData.email = userData.email;
      }
      if (userData.password && userData.password.trim()) {
        updateData.password = userData.password;
      }

      console.log('Оригінальні дані:', originalData);
      console.log('Нові дані:', userData);
      console.log('Дані для оновлення:', updateData);

      if (Object.keys(updateData).length === 0) {
        setError('Немає змін для оновлення');
        return;
      }

      const updatedUser = await updateUserProfile(userData.id, updateData);
      
      const newUserData = {
        ...userData,
        ...updatedUser,
        password: ''
      };
      
      setUserData(newUserData);
      setOriginalData(newUserData);
      handleNavigation('/')
      setSuccessMessage('Дані успішно оновлено');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      const errorMessage = err.message === 'The email has already been taken.' 
        ? 'Цей email вже використовується' 
        : err.message || 'Помилка при оновленні даних';
      setError(errorMessage);
      console.error('Помилка оновлення:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserData({
      ...userData,
      [e.target.name]: e.target.value
    });
  };

  if (isLoading && !userData.email) {
    return <div className="profile-container">Завантаження...</div>;
  }

  return (
    <div className="profile-container">
      <h1>Налаштування</h1>
      
      {error && <div className="error-message">{error}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}
      
      <form onSubmit={handleSubmit} className="profile-form">
        <div className="form-group">
          <label htmlFor="name">Ім'я</label>
          <input
            type="text"
            id="name"
            name="name"
            value={userData.name}
            onChange={handleChange}
            disabled={isLoading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Новий пароль</label>
          <input
            type="password"
            id="password"
            name="password"
            value={userData.password}
            onChange={handleChange}
            placeholder="Залиште порожнім, щоб не змінювати"
            disabled={isLoading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={userData.email}
            onChange={handleChange}
            disabled={isLoading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="phone">Телефон</label>
          <input
            type="tel"
            id="phone"
            name="phone_numbers"
            value={userData.phone_numbers}
            onChange={handleChange}
            disabled={isLoading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="age">Вік</label>
          <input
            type="number"
            id="age"
            name="age"
            value={userData.age}
            onChange={handleChange}
            disabled={isLoading}
          />
        </div>

        <button onClick={handleSubmit} type="submit" className="save-button" disabled={isLoading}>
          {isLoading ? 'Збереження...' : 'Зберегти'}
        </button>
      </form>
    </div>
  );
}
