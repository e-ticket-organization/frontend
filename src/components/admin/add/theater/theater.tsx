'use client'
import React, { useState, useEffect } from 'react';
import './theater.styles.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Link from 'next/link';
import { faArrowLeft, faTheaterMasks } from '@fortawesome/free-solid-svg-icons';
import { ICreateTheater } from '@/app/types/theater';
import { ICity } from '@/app/types/city';
import { createTheater, getCities } from '@/app/services/filmService';
import { getToken } from '@/app/services/authService';
import { useRouter } from 'next/navigation';

export default function AddTheater() {
  const [theater, setTheater] = useState<ICreateTheater>({
    name: '',
    address: '',
    cityIds: []
  });
  
  const [cities, setCities] = useState<ICity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCities, setIsLoadingCities] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchCities = async () => {
      try {
        const citiesData = await getCities();
        setCities(citiesData);
      } catch (error) {
        console.error('Помилка завантаження міст:', error);
        setError('Помилка завантаження списку міст');
      } finally {
        setIsLoadingCities(false);
      }
    };

    fetchCities();
  }, []);

  const validateForm = () => {
    if (!theater.name.trim()) {
      setError("Назва театру є обов'язковим полем");
      return false;
    }
    if (theater.name.trim().length < 2) {
      setError('Назва театру повинна містити принаймні 2 символи');
      return false;
    }
    if (theater.cityIds.length === 0) {
      setError('Оберіть принаймні одне місто для театру');
      return false;
    }
    return true;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setError('');
    setTheater({ ...theater, [e.target.name]: e.target.value });
  };

  const handleCityChange = (cityId: number, isChecked: boolean) => {
    setError('');
    let newCityIds = [...theater.cityIds];
    
    if (isChecked) {
      if (!newCityIds.includes(cityId)) {
        newCityIds.push(cityId);
      }
    } else {
      newCityIds = newCityIds.filter(id => id !== cityId);
    }
    
    setTheater({ ...theater, cityIds: newCityIds });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setIsLoading(true);
    try {
      console.log('Створення театру:', theater);
      
      const theaterData = {
        name: theater.name.trim(),
        address: theater.address?.trim() || undefined,
        cityIds: theater.cityIds
      };
      
      await createTheater(theaterData);
      setSuccess(true);
      setTimeout(() => {
        router.push('/admin');
      }, 2000);
    } catch (error: any) {
      console.error('Помилка створення театру:', error);
      
      const errorMessage = error.message || 'Помилка при додаванні театру';
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

  if (isLoadingCities) {
    return (
      <section className='add-theater-container'>
        <div className="loading-message">Завантаження даних...</div>
      </section>
    );
  }

  return (
    <section className='add-theater-container'>
      <button className='back-button'>
        <Link href="/admin">
          <FontAwesomeIcon icon={faArrowLeft as any} /> Повернутися
        </Link>
      </button>

      <h1 className="form-title">
        <FontAwesomeIcon icon={faTheaterMasks as any} className="title-icon" />
        Додати новий театр
      </h1>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">Театр успішно додано!</div>}
      
      <form onSubmit={handleSubmit}>
        <label>
          <input 
            type="text" 
            placeholder="Назва театру *" 
            name="name" 
            value={theater.name} 
            onChange={handleChange} 
            required 
            maxLength={200}
          />
        </label>

        <label>
          <textarea 
            placeholder="Адреса театру (необов'язково)" 
            name="address" 
            value={theater.address || ''} 
            onChange={handleChange} 
            maxLength={500}
            rows={3}
          />
        </label>

        <div className="cities-section">
          <h3>Оберіть міста для театру *</h3>
          <div className="cities-list">
            {cities.map((city) => (
              <label key={city.id} className="city-checkbox">
                <input
                  type="checkbox"
                  checked={theater.cityIds.includes(city.id)}
                  onChange={(e) => handleCityChange(city.id, e.target.checked)}
                />
                <span className="checkmark"></span>
                {city.name}
              </label>
            ))}
          </div>
          {cities.length === 0 && (
            <p className="no-cities">Немає доступних міст. Спочатку додайте міста.</p>
          )}
        </div>
        
        <button 
          type="submit" 
          disabled={isLoading || cities.length === 0}
          className={isLoading ? 'loading' : ''}
        >
          {isLoading ? 'Додавання...' : 'Додати театр'}
        </button>
      </form>
    </section>
  );
} 