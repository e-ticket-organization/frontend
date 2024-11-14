'use client'
import React, { useEffect, useState } from 'react';
import './producer.styles.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Link from 'next/link';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { IProducer } from '@/app/types/producer';
import { addProducer } from '@/app/services/filmService';
import { getToken } from '@/app/services/authService';
import { useRouter } from 'next/navigation';
export default function Producers() {
  const [producer, setProducer] = useState<IProducer>({
    id: 0,
    first_name: '',
    last_name: '',
    phone_number: '',
    email: '',
    date_of_birth: '',
    created_at: '',
    updated_at: '',
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const validateForm = () => {
    if (!producer.first_name.trim()) {
      setError("Ім'я є обов'язковим полем");
      return false;
    }
    if (!producer.last_name.trim()) {
      setError('Прізвище є обов\'язковим полем');
      return false;
    }
    if (producer.date_of_birth && !/^\d{2}\/\d{2}\/\d{4}$/.test(producer.date_of_birth)) {
      setError('Невірний формат дати. Використовуйте формат ДД/ММ/РРРР');
      return false;
    }
    if (producer.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(producer.email)) {
      setError('Невірний формат email');
      return false;
    }
    if (producer.phone_number && !/^\+?\d{10,13}$/.test(producer.phone_number)) {
      setError('Невірний формат номера телефону');
      return false;
    }
    return true;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(''); // Очищаємо помилки при зміні полів
    setProducer({ ...producer, [e.target.name]: e.target.value });
  };

  const formatDateForInput = (dateString: string) => {
    if (!dateString) return '';
    const [day, month, year] = dateString.split('/');
    return `${year}-${month}-${day}`;
  };

  const formatDateForDisplay = (dateString: string) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputDate = e.target.value;
    const [year, month, day] = inputDate.split('-');
    const formattedDate = `${day}/${month}/${year}`;
    setProducer({ ...producer, date_of_birth: formattedDate });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setIsLoading(true);
    try {
      const producerData: IProducer = {
        id: Number(producer.id),
        first_name: producer.first_name.trim(),
        last_name: producer.last_name.trim(),
        date_of_birth: producer.date_of_birth,
        email: producer.email.trim(),
        phone_number: producer.phone_number.trim(),
        created_at: '',
        updated_at: ''
      };
      
      await addProducer(producerData);
      setSuccess(true);
      setTimeout(() => {
        router.push('/admin');
      }, 2000);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Помилка при додаванні продюсера');
    } finally {
      setIsLoading(false);
    }
  };


  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push('/login');
      return;
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
      {success && <div className="success-message">Продюсера успішно додано!</div>}
      
      <form onSubmit={handleSubmit}>
        <label>
          <input 
            type="text" 
            placeholder="Ім'я" 
            name="first_name" 
            value={producer.first_name} 
            onChange={handleChange} 
            required 
          />
        </label>
        <label>
          <input 
            type="text" 
            placeholder="Прізвище" 
            name="last_name" 
            value={producer.last_name} 
            onChange={handleChange} 
            required 
          />
        </label>
        <label>
          <input 
            type="date" 
            placeholder='Дата народження' 
            name="date_of_birth" 
            value={producer.date_of_birth ? formatDateForInput(producer.date_of_birth) : ''}
            onChange={handleDateChange}
            max={new Date().toISOString().split('T')[0]}
          />
        </label>
        <label>
          <input 
            type="email" 
            placeholder='Email' 
            name="email" 
            value={producer.email || ''} 
            onChange={handleChange}
            pattern="[^\s@]+@[^\s@]+\.[^\s@]+"
          />
        </label>
        <label>
          <input 
            type="tel" 
            placeholder='Номер телефону (+380...)' 
            name="phone_number" 
            value={producer.phone_number || ''} 
            onChange={handleChange}
            pattern="\+?\d{10,13}"
          />
        </label>
        <button 
          type="submit" 
          disabled={isLoading}
          className={isLoading ? 'loading' : ''}
        >
          {isLoading ? 'Додавання...' : 'Додати продюсера'}
        </button>
      </form>
    </section>
  );
}