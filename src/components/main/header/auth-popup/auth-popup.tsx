import React, { useState, useContext } from 'react';
import { AuthContext } from '@/app/context/authContext';
import './auth.popup.styles.css';
import { LoginCredentials, RegisterCredentials } from '@/app/types/auth';

export default function AuthPopup({ onClose }: { onClose: () => void }) {
  const { login, register } = useContext(AuthContext);
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: ''
  });

  const handleToggle = () => {
    setIsLogin(!isLogin);
    setError(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      password_confirmation: ''
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (isLogin) {
        const loginData: LoginCredentials = {
          email: formData.email,
          password: formData.password
        };
        await login(loginData);
      } else {
        const registerData: RegisterCredentials = {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          password_confirmation: formData.password_confirmation
        };
        await register(registerData);
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Помилка авторизації');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='auth-popup'>
      <div className='auth-content'>
        <button className='close-button' onClick={onClose}>
          &times;
        </button>
        <h2>{isLogin ? 'Увійти' : 'Реєстрація'}</h2>
        {error && <div className='error-message'>{error}</div>}
        {isLoading && <div className='loading-spinner'></div>}
        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className='form-group'>
              <label htmlFor='name'>Ім'я користувача</label>
              <input
                type='text'
                id='name'
                name='name'
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
          )}
          <div className='form-group'>
            <label htmlFor='email'>Електронна пошта</label>
            <input
              type='email'
              id='email'
              name='email'
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className='form-group'>
            <label htmlFor='password'>Пароль</label>
            <input
              type='password'
              id='password'
              name='password'
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>
          {!isLogin && (
            <div className='form-group'>
              <label htmlFor='password_confirmation'>Підтвердження паролю</label>
              <input
                type='password'
                id='password_confirmation'
                name='password_confirmation'
                value={formData.password_confirmation}
                onChange={handleChange}
                required
              />
            </div>
          )}
          <button type='submit' className='submit-button'>
            {isLogin ? 'Увійти' : 'Зареєструватися'}
          </button>
        </form>
        <div className='toggle-section'>
          {isLogin ? (
            <p>
              Немає облікового запису?{' '}
              <span className='toggle-link' onClick={handleToggle}>
                Зареєструватися
              </span>
            </p>
          ) : (
            <p>
              Вже маєте обліковий запис?{' '}
              <span className='toggle-link' onClick={handleToggle}>
                Увійти
              </span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}