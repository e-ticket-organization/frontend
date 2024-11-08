import React, { useState, useContext } from 'react';
import { AuthContext } from '@/app/context/authContext';
import { useRouter } from 'next/router';
import { RegisterCredentials } from '@/app/types/auth';

const AdminRegister = () => {
  const { register } = useContext(AuthContext);
  const router = useRouter();

  const [credentials, setCredentials] = useState<RegisterCredentials>({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
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
      await register(credentials);
      router.push('/dashboard');
    } catch (error) {
      console.error('Помилка при реєстрації:', error);

    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Реєстрація</h2>
      <div>
        <label>Ім'я:</label>
        <input 
          type="text" 
          name="name" 
          value={credentials.name} 
          onChange={handleChange} 
          required 
        />
      </div>
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
      <div>
        <label>Підтвердження Паролю:</label>
        <input 
          type="password" 
          name="password_confirmation" 
          value={credentials.password_confirmation} 
          onChange={handleChange} 
          required 
        />
      </div>
      <button type="submit">Зареєструватися</button>
    </form>
  );
};

export default AdminRegister;