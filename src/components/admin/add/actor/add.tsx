'use client'
import React, { useState, useEffect } from 'react';
import './add.styles.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Link from 'next/link';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { IActor } from '@/app/types/actor';
import { addActor } from '@/app/services/filmService';
import { getToken } from '@/app/services/authService';
import { useRouter } from 'next/navigation';

export default function Add() {
  const [actor, setActor] = useState<IActor>({
    id: 0,
    first_name: '',
    last_name: '',
    date_of_birth: '',
    passport: '',
    phone_number: '',
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const validateForm = () => {
    if (!actor.first_name.trim()) {
      setError("Ім'я є обов'язковим полем");
      return false;
    }
    if (!actor.last_name.trim()) {
      setError('Прізвище є обов\'язковим полем');
      return false;
    }
    if (!actor.date_of_birth) {
      setError('Дата народження є обов\'язковим полем');
      return false;
    }
    if (!actor.phone_number) {
      setError('Номер телефону є обов\'язковим полем');
      return false;
    }
    if (!actor.passport) {
      setError('Код паспорта є обов\'язковим полем');
      return false;
    }
    if (actor.date_of_birth && !/^\d{2}\/\d{2}\/\d{4}$/.test(actor.date_of_birth)) {
      setError('Невірний формат дати. Використовуйте формат ДД/ММ/РРРР');
      return false;
    }
    if (actor.phone_number && !/^\+?\d{10,13}$/.test(actor.phone_number)) {
      setError('Невірний формат номера телефону');
      return false;
    }
    return true;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    setActor({ ...actor, [e.target.name]: e.target.value });
  };

  const formatDateForBackend = (dateString: string) => {
    if (!dateString) return '';
    const [day, month, year] = dateString.split('/');
    return `${year}-${month}-${day}`;
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputDate = e.target.value;
    const [year, month, day] = inputDate.split('-');
    const formattedDate = `${day}/${month}/${year}`;
    setActor({ ...actor, date_of_birth: formattedDate });
    setError('');
  };

  const formatDateForInput = (dateString: string) => {
    if (!dateString) return '';
    const [day, month, year] = dateString.split('/');
    return `${year}-${month}-${day}`;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setIsLoading(true);
    try {
      if (!actor.first_name || !actor.last_name || !actor.phone_number || 
          !actor.date_of_birth || !actor.passport) {
        setError('Всі поля є обов\'язковими');
        return;
      }

      const actorData = {
        first_name: actor.first_name.trim(),
        last_name: actor.last_name.trim(),
        phone_number: actor.phone_number.trim(),
        passport: actor.passport.trim(),
        date_of_birth: formatDateForBackend(actor.date_of_birth),
      };
      
      await addActor(actorData);
      setSuccess(true);
      setTimeout(() => {
        router.push('/admin');
      }, 2000);
    } catch (error: any) {
      console.error('Error details:', error);
      setError(error.response?.data?.message || 'Помилка при додаванні актора');
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
    <section className='add-actor-container'>
      <button className='back-button'>
        <Link href="/admin">
          <FontAwesomeIcon icon={faArrowLeft} /> Повернутися
        </Link>
      </button>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">Актора успішно додано!</div>}
      
      <form onSubmit={handleSubmit}>
        <label>
          <input 
            type="text" 
            placeholder="Ім'я *" 
            name="first_name" 
            value={actor.first_name} 
            onChange={handleChange} 
            required 
          />
        </label>
        <label>
          <input 
            type="text" 
            placeholder="Прізвище *" 
            name="last_name" 
            value={actor.last_name} 
            onChange={handleChange} 
            required 
          />
        </label>
        <label>
          <input 
            type="date" 
            placeholder='Дата народження *' 
            name="date_of_birth" 
            value={actor.date_of_birth ? formatDateForInput(actor.date_of_birth) : ''}
            onChange={handleDateChange}
            max={new Date().toISOString().split('T')[0]}
            required
          />
        </label>
        <label>
          <input 
            type="text" 
            placeholder='Код паспорта *' 
            name="passport" 
            value={actor.passport || ''} 
            onChange={handleChange}
            required
          />
        </label>
        <label>
          <input 
            type="tel" 
            placeholder='Номер телефону (+380...) *' 
            name="phone_number" 
            value={actor.phone_number || ''} 
            onChange={handleChange}
            pattern="\+?\d{10,13}"
            required
          />
        </label>
        <button 
          type="submit" 
          disabled={isLoading}
          className={isLoading ? 'loading' : ''}
        >
          {isLoading ? 'Додавання...' : 'Додати актора'}
        </button>
      </form>
    </section>
  );
}