'use client';

import React, { useState, useEffect, useContext } from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import { uk } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';
import './profile.styles.css';
import { getUserProfile, updateUserProfile, updateNewsletterSubscription } from '@/app/services/filmService';
import { IUser } from '@/app/types/user';
import { useRouter } from 'next/dist/client/components/navigation';
import { AuthContext } from '@/app/context/authContext';

// Реєструємо українську локаль
registerLocale('uk', uk);

export default function Profile() {
  const { user } = useContext(AuthContext);
  const [userData, setUserData] = useState<IUser>({
    id: 0,
    name: '',
    email: '',
    password: '',
    phoneNumbers: '',
    dateOfBirth: '',
    newsletterSubscription: false
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [originalData, setOriginalData] = useState<IUser | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

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
        dateOfBirth: currentUser.dateOfBirth || '',
        newsletterSubscription: currentUser.newsletterSubscription || false
      };
      
      // Конвертуємо дату з рядка в об'єкт Date для DatePicker
      if (currentUser.dateOfBirth) {
        setSelectedDate(new Date(currentUser.dateOfBirth));
      }
      
      setUserData(userData);
      setOriginalData(userData);
      setError(null);
    } catch (err: any) {
      setError('Помилка при завантаженні даних користувача');
      console.error('Помилка завантаження:', err);
      if (err?.response?.status === 401) {
        window.location.href = '/';
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateChange = (date: Date | null) => {
    setSelectedDate(date);
    // Конвертуємо дату в формат YYYY-MM-DD для API
    const dateString = date ? date.toISOString().split('T')[0] : '';
    setUserData({
      ...userData,
      dateOfBirth: dateString
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setError(null);
      
      const updateData: Partial<IUser> = {};
      
      console.log('Порівняння phoneNumbers:', {
        current: userData.phoneNumbers,
        original: originalData?.phoneNumbers
      });

      if (userData.name !== originalData?.name && userData.name.trim()) {
        updateData.name = userData.name;
      }
      if (userData.phoneNumbers !== originalData?.phoneNumbers && userData.phoneNumbers?.trim()) {
        updateData.phoneNumbers = userData.phoneNumbers;
      }
      if (userData.dateOfBirth !== originalData?.dateOfBirth && userData.dateOfBirth?.trim()) {
        updateData.dateOfBirth = userData.dateOfBirth;
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

      const updatedUser = await updateUserProfile(updateData);
      
      const newUserData = {
        ...userData,
        ...updatedUser,
        password: ''
      };
      
      setUserData(newUserData);
      setOriginalData(newUserData);
      handleNavigation('/');
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
    const { name, value, type, checked } = e.target;
    setUserData({
      ...userData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleNewsletterChange = async (checked: boolean) => {
    try {
      await updateNewsletterSubscription(checked);
      setUserData({
        ...userData,
        newsletterSubscription: checked
      });
      setSuccessMessage(checked ? 'Підписка на розсилку увімкнена' : 'Підписка на розсилку вимкнена');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error: any) {
      setError(error.message || 'Помилка при оновленні налаштувань розсилки');
      setTimeout(() => setError(null), 3000);
    }
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
            value={userData.phoneNumbers || ''}
            onChange={handleChange}
            disabled={isLoading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="dateOfBirth">Дата народження</label>
          <DatePicker
            selected={selectedDate}
            onChange={handleDateChange}
            dateFormat="dd/MM/yyyy"
            placeholderText="Оберіть дату народження"
            showYearDropdown
            showMonthDropdown
            dropdownMode="select"
            yearDropdownItemNumber={100}
            scrollableYearDropdown
            maxDate={new Date()}
            minDate={new Date(1900, 0, 1)}
            className="date-picker-input"
            disabled={isLoading}
            locale="uk"
            showPopperArrow={false}
            popperClassName="custom-datepicker-popper"
            calendarClassName="custom-datepicker-calendar"
          />
        </div>

        <div className="form-group newsletter-group">
          <div className="newsletter-toggle">
            <label htmlFor="newsletter" className="newsletter-label">
              Розсилка новин
            </label>
            <p className="newsletter-description">
              Отримувати повідомлення про нові вистави та спеціальні пропозиції
            </p>
            <div className="toggle-switch">
              <input
                type="checkbox"
                id="newsletter"
                name="newsletterSubscription"
                checked={userData.newsletterSubscription || false}
                onChange={(e) => handleNewsletterChange(e.target.checked)}
                disabled={isLoading}
                className="toggle-input"
              />
              <label htmlFor="newsletter" className="toggle-label">
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>
        </div>

        <button onClick={handleSubmit} type="submit" className="save-button" disabled={isLoading}>
          {isLoading ? 'Збереження...' : 'Зберегти'}
        </button>
      </form>
    </div>
  );
}
