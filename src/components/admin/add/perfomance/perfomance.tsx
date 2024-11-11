'use client'
import React, { useState, useEffect } from 'react';
import './perfomance.styles.css';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { getProducers, addPerfomance, getGenres } from '@/app/services/filmService';
import { IProducer } from '@/app/types/producer';
import { useRouter } from 'next/navigation';
import { getToken } from '@/app/services/authService';
import { IGenre } from '@/app/types/genre';

export default function Perfomance() {
  const router = useRouter();
  const [perfomance, setPerfomance] = useState({
    title: '',
    duration: '',
    producer: '',
    image: '',
    genre_id: ''
  });
  const [producers, setProducers] = useState<IProducer[]>([]);
  const [genres, setGenres] = useState<IGenre[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push('admin/login');
      return;
    }

    const loadData = async () => {
      try {
        const [producersData, genresData] = await Promise.all([
          getProducers(),
          getGenres()
        ]);
        setProducers(producersData);
        setGenres(genresData);
      } catch (err) {
        setError('Помилка завантаження даних');
      }
    };
    loadData();
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setPerfomance({ ...perfomance, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!perfomance.producer || !perfomance.genre_id) {
      setError('Будь ласка, виберіть продюсера та жанр');
      setLoading(false);
      return;
    }

    try {
      const performanceData = {
        title: perfomance.title,
        duration: Number(perfomance.duration),
        image: perfomance.image,
        producer: Number(perfomance.producer),
        genre_id: Number(perfomance.genre_id)
      };

      console.log('Відправляємо дані:', performanceData);

      await addPerfomance(performanceData);
      router.push('/admin');
    } catch (err: any) {
      console.error('Error:', err);
      setError(err.message || 'Помилка при додаванні вистави');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className='add-perfomance-container'>
      <button className='back-button'>
        <Link href="/admin">
          <FontAwesomeIcon icon={faArrowLeft} /> Повернутися
        </Link>
      </button>
      <form className='perfomance-form' onSubmit={handleSubmit}>
        {error && <div className="error-message">{error}</div>}
        
        <input 
          className='form-input' 
          placeholder='Введіть назву' 
          type="text" 
          name="title" 
          value={perfomance.title} 
          onChange={handleChange} 
          required 
        />
        
        <input 
          className='form-input' 
          placeholder='Введіть тривалість' 
          type="number" 
          name="duration" 
          value={perfomance.duration} 
          onChange={handleChange} 
          required 
        />

        <select 
          className='form-input'
          name="genre_id"
          value={perfomance.genre_id}
          onChange={handleChange}
          required
        >
          <option value="">Виберіть жанр</option>
          {genres.map((genre) => (
            <option key={genre.id} value={genre.id}>
              {genre.name}
            </option>
          ))}
        </select>
        
        <select 
          className='form-input'
          name="producer"
          value={perfomance.producer}
          onChange={handleChange}
          required
        >
          <option value="">Виберіть продюсера</option>
          {producers.map((producer) => (
            <option key={producer.id} value={producer.id}>
              {`${producer.first_name} ${producer.last_name}`}
            </option>
          ))}
        </select>
        
        <input 
          className='form-input' 
          placeholder='Введіть URL зображення' 
          type="text" 
          name="image" 
          value={perfomance.image} 
          onChange={handleChange} 
          required 
        />
        
        <button 
          className='submit-button' 
          type="submit" 
          disabled={loading}
        >
          {loading ? 'Додавання...' : 'Додати виставу'}
        </button>
      </form>
    </section>
  );
}
