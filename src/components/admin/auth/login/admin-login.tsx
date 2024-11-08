import React, { useState, useContext } from 'react';
import { AuthContext } from '@/app/context/authContext';
import { useRouter } from 'next/router';
import { LoginCredentials } from '@/app/types/auth';

const Login = () => {
  const { login } = useContext(AuthContext);
  const router = useRouter();

  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: '',
    password: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(credentials);
      router.push('/dashboard');
    } catch (error) {
      console.error('Помилка при вході:', error);
      // Обробка помилок
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Вхід</h2>
      <div>
        <label>Email:</label>
        <input 
          type="email" 
          name="email" 
          value={credentials.email} 
          onChange={handleChange} 
          required 
        />
      </div>
      <div>
        <label>Пароль:</label>
        <input 
          type="password" 
          name="password" 
          value={credentials.password} 
          onChange={handleChange} 
          required 
        />
      </div>
      <button type="submit">Увійти</button>
    </form>
  );
};

export default Login;