'use client'
import React, { useState, useEffect } from 'react';
import './perfomance.styles.css';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { 
  getAllProducers, 
  addPerfomance, 
  getGenres, 
  getAllActors, 
  getCities, 
  getTheaters 
} from '@/app/services/filmService';
import { IProducer } from '@/app/types/producer';
import { useRouter } from 'next/navigation';
import { getToken } from '@/app/services/authService';
import { IGenre } from '@/app/types/genre';
import { IActor } from '@/app/types/actor';
import { ICity } from '@/app/types/city';
import { ITheater } from '@/app/types/theater';
import { IPerfomanceCreate } from '@/app/types/perfomance';

export default function Perfomance() {
  const router = useRouter();
  const [perfomance, setPerfomance] = useState<IPerfomanceCreate>({
    title: '',
    description: '',
    duration: 0,
    image: '',
    producer_id: 0,
    genre_ids: [],
    actor_ids: [],
    premiereDate: '',
    price: 0,
    city_id: 0,
    theater_id: 0
  });
  
  const [producers, setProducers] = useState<IProducer[]>([]);
  const [genres, setGenres] = useState<IGenre[]>([]);
  const [actors, setActors] = useState<IActor[]>([]);
  const [cities, setCities] = useState<ICity[]>([]);
  const [theaters, setTheaters] = useState<ITheater[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [selectedActors, setSelectedActors] = useState<{id: number, name: string}[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<{id: number, name: string}[]>([]);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push('/admin/login');
      return;
    }

    const loadData = async () => {
      try {
        const [producersData, genresData, actorsData, citiesData, theatersData] = await Promise.all([
          getAllProducers(),
          getGenres(),
          getAllActors(),
          getCities(),
          getTheaters()
        ]);
        
        setProducers(producersData);
        setGenres(genresData);
        setActors(actorsData || []);
        setCities(citiesData || []);
        setTheaters(theatersData || []);
      } catch (err) {
        console.error('Помилка завантаження даних:', err);
        setError('Помилка завантаження даних');
      }
    };
    loadData();
  }, [router]);

  const validateForm = () => {
    if (!perfomance.title.trim()) {
      setError('Назва є обов\'язковим полем');
      return false;
    }
    if (!perfomance.description.trim()) {
      setError('Опис є обов\'язковим полем');
      return false;
    }
    if (!perfomance.duration || perfomance.duration <= 0) {
      setError('Тривалість має бути більше 0');
      return false;
    }
    if (!perfomance.producer_id) {
      setError('Виберіть продюсера');
      return false;
    }
    if (!perfomance.premiereDate) {
      setError('Дата прем\'єри є обов\'язковим полем');
      return false;
    }
    if (!perfomance.price || perfomance.price <= 0) {
      setError('Ціна має бути більше 0');
      return false;
    }
    if (!perfomance.city_id) {
      setError('Виберіть місто');
      return false;
    }
    if (!perfomance.theater_id) {
      setError('Виберіть театр');
      return false;
    }
    return true;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'duration' || name === 'price' || name === 'producer_id' || name === 'city_id' || name === 'theater_id') {
      setPerfomance(prev => ({
        ...prev,
        [name]: Number(value)
      }));
    } else {
      setPerfomance(prev => ({
        ...prev,
        [name]: value
      }));
    }
    setError('');
  };

  const handleActorSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedActorId = Number(e.target.value);
    const actor = actors.find(a => a.id === selectedActorId);
    
    if (actor && !selectedActors.some(sa => sa.id === selectedActorId)) {
      const newSelectedActors = [...selectedActors, {
        id: selectedActorId,
        name: `${actor.first_name} ${actor.last_name}`
      }];
      setSelectedActors(newSelectedActors);
      setPerfomance(prev => ({
        ...prev,
        actor_ids: newSelectedActors.map(a => a.id)
      }));
    }
    
    e.target.value = '';
  };

  const removeActor = (actorId: number) => {
    const newSelectedActors = selectedActors.filter(a => a.id !== actorId);
    setSelectedActors(newSelectedActors);
    setPerfomance(prev => ({
      ...prev,
      actor_ids: newSelectedActors.map(a => a.id)
    }));
  };

  const handleGenreSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedGenreId = Number(e.target.value);
    const genre = genres.find(g => g.id === selectedGenreId);
    
    if (genre && !selectedGenres.some(sg => sg.id === selectedGenreId)) {
      const newSelectedGenres = [...selectedGenres, {
        id: selectedGenreId,
        name: genre.name
      }];
      setSelectedGenres(newSelectedGenres);
      setPerfomance(prev => ({
        ...prev,
        genre_ids: newSelectedGenres.map(g => g.id)
      }));
    }
    
    e.target.value = '';
  };

  const removeGenre = (genreId: number) => {
    const newSelectedGenres = selectedGenres.filter(g => g.id !== genreId);
    setSelectedGenres(newSelectedGenres);
    setPerfomance(prev => ({
      ...prev,
      genre_ids: newSelectedGenres.map(g => g.id)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setError('');

    try {
      console.log('Відправляємо дані:', perfomance);
      
      await addPerfomance(perfomance);
      router.push('/admin');
    } catch (err: any) {
      console.error('Error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Помилка при додаванні вистави';
      
      if (err.response?.data?.message && Array.isArray(err.response.data.message)) {
        setError(err.response.data.message.join(', '));
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className='add-perfomance-container'>
      <button className='back-button'>
        <Link href="/admin">
          <FontAwesomeIcon icon={faArrowLeft as any} /> Повернутися
        </Link>
      </button>
      <form className='perfomance-form' onSubmit={handleSubmit}>
        {error && <div className="error-message">{error}</div>}
        
        <input 
          className='form-input' 
          placeholder='Введіть назву *' 
          type="text" 
          name="title" 
          value={perfomance.title} 
          onChange={handleChange} 
          required 
        />
        
        <textarea 
          className='form-input' 
          placeholder='Введіть опис *' 
          name="description" 
          value={perfomance.description} 
          onChange={handleChange}
          rows={4}
          required
        />
        
        <input 
          className='form-input' 
          placeholder='Введіть тривалість (хвилини) *' 
          type="number" 
          name="duration" 
          value={perfomance.duration || ''} 
          onChange={handleChange} 
          min="1"
          required 
        />

        <input 
          className='form-input' 
          placeholder='Введіть URL зображення' 
          type="url" 
          name="image" 
          value={perfomance.image} 
          onChange={handleChange} 
        />

        <select 
          className='form-input'
          name="producer_id"
          value={perfomance.producer_id || ''}
          onChange={handleChange}
          required
        >
          <option value="">Виберіть продюсера *</option>
          {producers.map((producer) => (
            <option key={producer.id} value={producer.id}>
              {`${producer.first_name} ${producer.last_name}`}
            </option>
          ))}
        </select>

        <select 
          className='form-input'
          name="city_id"
          value={perfomance.city_id || ''}
          onChange={handleChange}
          required
        >
          <option value="">Виберіть місто *</option>
          {cities.map((city) => (
            <option key={city.id} value={city.id}>
              {city.name}
            </option>
          ))}
        </select>

        <select 
          className='form-input'
          name="theater_id"
          value={perfomance.theater_id || ''}
          onChange={handleChange}
          required
        >
          <option value="">Виберіть театр *</option>
          {theaters.map((theater) => (
            <option key={theater.id} value={theater.id}>
              {theater.name}
            </option>
          ))}
        </select>

        <input 
          className='form-input' 
          placeholder='Дата прем&apos;єри *' 
          type="date" 
          name="premiereDate" 
          value={perfomance.premiereDate}
          onChange={handleChange}
          required
        />

        <input 
          className='form-input' 
          placeholder='Ціна (грн) *' 
          type="number" 
          step="0.01"
          min="0.01"
          name="price" 
          value={perfomance.price || ''} 
          onChange={handleChange}
          required
        />

        <div className="selection-container">
          <div className="genres-selection">
            <select 
              className='form-input'
              onChange={handleGenreSelect}
              value=""
            >
              <option value="" disabled>Виберіть жанри</option>
              {genres
                .filter(genre => !selectedGenres.some(sg => sg.id === genre.id))
                .map((genre) => (
                  <option key={genre.id} value={genre.id}>
                    {genre.name}
                  </option>
              ))}
            </select>

            <div className="selected-items">
              {selectedGenres.map((genre) => (
                <div key={genre.id} className="selected-item-tag">
                  {genre.name}
                  <button 
                    type="button" 
                    onClick={() => removeGenre(genre.id)}
                    className="remove-item"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="actors-selection">
            <select 
              className='form-input'
              onChange={handleActorSelect}
              value=""
            >
              <option value="" disabled>Виберіть акторів</option>
              {actors
                .filter(actor => !selectedActors.some(sa => sa.id === actor.id))
                .map((actor) => (
                  <option key={actor.id} value={actor.id}>
                    {`${actor.first_name} ${actor.last_name}`}
                  </option>
              ))}
            </select>

            <div className="selected-items">
              {selectedActors.map((actor) => (
                <div key={actor.id} className="selected-item-tag">
                  {actor.name}
                  <button 
                    type="button" 
                    onClick={() => removeActor(actor.id)}
                    className="remove-item"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
        
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
