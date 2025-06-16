'use client'
import React, { useEffect, useState } from 'react';
import './producer.styles.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Link from 'next/link';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { IProducer, IProducerCreate } from '@/app/types/producer';
import { addProducer } from '@/app/services/filmService';
import { getToken } from '@/app/services/authService';
import { useRouter } from 'next/navigation';

export default function Producers() {
  const [producer, setProducer] = useState<IProducerCreate>({
    first_name: '',
    last_name: '',
    phone_number: '',
    email: '',
    date_of_birth: '',
    bio: '',
    photoUrl: ''
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
    if (!producer.email.trim()) {
      setError('Email є обов\'язковим полем');
      return false;
    }
    if (!producer.phone_number.trim()) {
      setError('Номер телефону є обов\'язковим полем');
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setError('');
    setProducer({ ...producer, [e.target.name]: e.target.value });
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputDate = e.target.value;
    setProducer({ ...producer, date_of_birth: inputDate });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setIsLoading(true);
    try {
      // Створюємо об'єкт даних продюсера
      const producerData: Omit<IProducer, 'id' | 'created_at' | 'updated_at'> = {
        first_name: producer.first_name.trim(),
        last_name: producer.last_name.trim(),
        email: producer.email.trim(),
        phone_number: producer.phone_number.trim(),
        bio: producer.bio?.trim(),
        photoUrl: producer.photoUrl?.trim()
      };

      // Додаємо дату тільки якщо вона є і валідна
      if (producer.date_of_birth && producer.date_of_birth.trim()) {
        // Перевіряємо чи дата вже в правильному форматі YYYY-MM-DD
        if (/^\d{4}-\d{2}-\d{2}$/.test(producer.date_of_birth.trim())) {
          producerData.date_of_birth = producer.date_of_birth.trim();
        } else {
          // Якщо ні, то конвертуємо
          const dateObj = new Date(producer.date_of_birth);
          if (!isNaN(dateObj.getTime())) {
            producerData.date_of_birth = dateObj.toISOString().split('T')[0];
          }
        }
      }
      
      console.log('Відправляємо дані продюсера:', producerData);
      
      await addProducer(producerData);
      setSuccess(true);
      setTimeout(() => {
        router.push('/admin');
      }, 2000);
    } catch (error: any) {
      console.error('Error details:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Помилка при додаванні продюсера';
      
      // Якщо це помилка валідації, показуємо детальну інформацію
      if (error.response?.data?.message && Array.isArray(error.response.data.message)) {
        setError(error.response.data.message.join(', '));
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push('/admin/login');
      return;
    }
  }, [router]);

  return (
    <section className='add-actor-container'>
      <button className='back-button'>
        <Link href="/admin">
          <FontAwesomeIcon icon={faArrowLeft as any} /> Повернутися
        </Link>
      </button>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">Продюсера успішно додано!</div>}
      
      <form onSubmit={handleSubmit}>
        <label>
          <input 
            type="text" 
            placeholder="Ім'я *" 
            name="first_name" 
            value={producer.first_name} 
            onChange={handleChange} 
            required 
          />
        </label>
        <label>
          <input 
            type="text" 
            placeholder="Прізвище *" 
            name="last_name" 
            value={producer.last_name} 
            onChange={handleChange} 
            required 
          />
        </label>
        <label>
          <input 
            type="email" 
            placeholder='Email *' 
            name="email" 
            value={producer.email} 
            onChange={handleChange}
            pattern="[^\s@]+@[^\s@]+\.[^\s@]+"
            required
          />
        </label>
        <label>
          <input 
            type="tel" 
            placeholder='Номер телефону (+380...) *' 
            name="phone_number" 
            value={producer.phone_number} 
            onChange={handleChange}
            pattern="\+?\d{10,13}"
            required
          />
        </label>
        <label>
          <input 
            type="date" 
            placeholder='Дата народження' 
            name="date_of_birth" 
            value={producer.date_of_birth}
            onChange={handleDateChange}
            max={new Date().toISOString().split('T')[0]}
          />
        </label>
        <label>
          <textarea 
            placeholder='Біографія' 
            name="bio" 
            value={producer.bio || ''} 
            onChange={handleChange}
            rows={4}
          />
        </label>
        <label>
          <input 
            type="url" 
            placeholder='URL фото' 
            name="photoUrl" 
            value={producer.photoUrl || ''} 
            onChange={handleChange}
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