'use client';

import React, { useState, useEffect, useContext } from 'react';
import './profile.styles.css';
import { getUserProfile, updateUserProfile } from '@/app/services/filmService';
import { IUser } from '@/app/types/user';
import { useRouter } from 'next/dist/client/components/navigation';
import { AuthContext } from '@/app/context/authContext';


function calculateAge(dateOfBirth: string): number {
  const birthDate = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}



export default function Profile() {
  const { user } = useContext(AuthContext);
  const [userData, setUserData] = useState<IUser>({
    id: 0,
    name: '',
    email: '',
    password: '',
    phoneNumbers: '',
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
      const currentUser = await getUserProfile();
      
      if (!currentUser) {
        throw new Error('Дані користувача не отримано');
      }
      
      const userData = {
        id: currentUser.id,
        name: currentUser.name || '',
        email: currentUser.email || '',
        password: '',
        phoneNumbers: currentUser.phoneNumbers || '',
        age: calculateAge(currentUser.dateOfBirth || '')
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
        current: userData.phoneNumbers,
        original: originalData?.phoneNumbers
      });

      if (userData.name !== originalData?.name && userData.name.trim()) {
        updateData.name = userData.name;
      }
      if (userData.phoneNumbers !== originalData?.phoneNumbers && userData.phoneNumbers?.trim()) {
        updateData.phoneNumbers = userData.phoneNumbers;
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
            name="phoneNumbers"
            value={userData.phoneNumbers}
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
