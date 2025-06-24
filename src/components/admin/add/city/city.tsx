'use client'
import React, { useState, useEffect } from 'react';
import './city.styles.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Link from 'next/link';
import { faArrowLeft, faCity } from '@fortawesome/free-solid-svg-icons';
import { ICreateCity } from '@/app/types/city';
import { createCity } from '@/app/services/filmService';
import { getToken } from '@/app/services/authService';
import { useRouter } from 'next/navigation';

export default function AddCity() {
  const [city, setCity] = useState<ICreateCity>({
    name: ''
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const validateForm = () => {
    if (!city.name.trim()) {
      setError("Назва міста є обов'язковим полем");
      return false;
    }
    if (city.name.trim().length < 2) {
      setError('Назва міста повинна містити принаймні 2 символи');
      return false;
    }
    return true;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    setCity({ ...city, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setIsLoading(true);
    try {
      console.log('Створення міста:', city);
      
      const cityData = {
        name: city.name.trim()
      };
      
      await createCity(cityData);
      setSuccess(true);
      setTimeout(() => {
        router.push('/admin');
      }, 2000);
    } catch (error: any) {
      console.error('Помилка створення міста:', error);
      
      const errorMessage = error.message || 'Помилка при додаванні міста';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const token = getToken();
    if (!token) {
      window.location.href = '/admin/login';
    }
  }, [router]);

  return (
    <section className='add-city-container'>
      <button className='back-button'>
        <Link href="/admin">
          <FontAwesomeIcon icon={faArrowLeft as any} /> Повернутися
        </Link>
      </button>

      <h1 className="form-title">
        <FontAwesomeIcon icon={faCity as any} className="title-icon" />
        Додати нове місто
      </h1>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">Місто успішно додано!</div>}
      
      <form onSubmit={handleSubmit}>
        <label>
          <input 
            type="text" 
            placeholder="Назва міста *" 
            name="name" 
            value={city.name} 
            onChange={handleChange} 
            required 
            maxLength={100}
          />
        </label>
        
        <button 
          type="submit" 
          disabled={isLoading}
          className={isLoading ? 'loading' : ''}
        >
          {isLoading ? 'Додавання...' : 'Додати місто'}
        </button>
      </form>
    </section>
  );
} 