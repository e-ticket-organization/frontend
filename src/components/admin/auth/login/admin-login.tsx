'use client';
import React, { useState, useContext } from 'react';
import { AuthContext } from '@/app/context/authContext';
import { useRouter } from 'next/navigation';
import { LoginCredentials } from '@/app/types/auth';
import './admin-login.styles.css';

const AdminLogin = () => {
  const { admin_login } = useContext(AuthContext);
  const router = useRouter();

  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: '',
    password: '',
  });

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await admin_login(credentials);
      window.location.href = '/admin';
    } catch (error) {
      console.error('Помилка при вході:', error);
      setError('Невірний електронний лист або пароль.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="admin-login-container">
      <h2>Адмін Вхід</h2>
      {isLoading && <div className="loading-spinner"></div>}
      {error && <div className="error-message">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">Електронна пошта:</label>
          <input 
            type="email" 
            id="email"
            name="email" 
            value={credentials.email} 
            onChange={handleChange} 
            required 
            placeholder="Введіть ваш Email"
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Пароль:</label>
          <input 
            type="password" 
            id="password"
            name="password" 
            value={credentials.password} 
            onChange={handleChange} 
            required 
            placeholder="Введіть ваш пароль"
          />
        </div>
        <button type="submit" className="submit-button" disabled={isLoading}>
          {isLoading ? 'Входжу...' : 'Увійти'}
        </button>
      </form>
    </div>
  );
};

export default AdminLogin;