'use client'
import React, { useState, useEffect } from 'react';
import './perfomance.styles.css';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { getProducers, addPerfomance, getGenres, getActors } from '@/app/services/filmService';
import { IProducer } from '@/app/types/producer';
import { useRouter } from 'next/navigation';
import { getToken } from '@/app/services/authService';
import { IGenre } from '@/app/types/genre';
import { IActor } from '@/app/types/actor';
export default function Perfomance() {
  const router = useRouter();
  const [perfomance, setPerfomance] = useState({
    title: '',
    duration: '',
    producer_id: '',
    image: '',
    genre_id: '',
    actors: [] as string[]
  });
  const [producers, setProducers] = useState<IProducer[]>([]);
  const [genres, setGenres] = useState<IGenre[]>([]);
  const [actors, setActors] = useState<IActor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [selectedActor, setSelectedActor] = useState('');
  const [selectedActors, setSelectedActors] = useState<{id: string, name: string}[]>([]);


  useEffect(() => {
    const token = getToken();
    if (!token) {
      window.location.href = '/admin/login';
      return;
    }

    const loadData = async () => {
      try {
        const [producersData, genresData, actorsData] = await Promise.all([
          getProducers(),
          getGenres(),
          getActors()
        ]);
        
        console.log('Завантажені актори:', actorsData);
        
        setProducers(producersData);
        setGenres(genresData);
        setActors(actorsData || []);
      } catch (err) {
        console.error('Помилка завантаження даних:', err);
        setError('Помилка завантаження даних');
      }
    };
    loadData();
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    console.log(`Зміна поля ${name}:`, value); 
    setPerfomance(prev => ({
        ...prev,
        [name]: value
    }));
};

  const handleActorSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedActorId = e.target.value;
    const actor = actors.find(a => a.id?.toString() === selectedActorId);
    
    if (actor && !selectedActors.some(sa => sa.id === selectedActorId)) {
      setSelectedActors([...selectedActors, {
        id: selectedActorId,
        name: `${actor.first_name} ${actor.last_name}`
      }]);
      setPerfomance(prev => ({
        ...prev,
        actors: [...prev.actors, selectedActorId]
      }));
    }
    
    e.target.value = '';
  };

  const removeActor = (actorId: string) => {
    setSelectedActors(selectedActors.filter(a => a.id !== actorId));
    setPerfomance(prev => ({
      ...prev,
      actors: prev.actors.filter(id => id !== actorId)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!perfomance.producer_id || !perfomance.genre_id) {
      setError('Будь ласка, виберіть продюсера та жанр');
      setLoading(false);
      return;
    }

    try {
      const performanceData = {
        title: perfomance.title,
        duration: Number(perfomance.duration),
        image: perfomance.image,
        producer: Number(perfomance.producer_id),
        genre_id: Number(perfomance.genre_id),
        actors: perfomance.actors.map(Number)
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
          name="producer_id"
          value={perfomance.producer_id}
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
        
        <div className="actors-selection">
          <select 
            className='form-input actors-select'
            onChange={handleActorSelect}
            value=""
          >
            <option value="" disabled>Виберіть акторів</option>
            {actors
              .filter(actor => !selectedActors.some(sa => sa.id === actor.id?.toString()))
              .map((actor) => (
                <option key={actor.id} value={actor.id}>
                  {`${actor.first_name} ${actor.last_name}`}
                </option>
          ))}
          </select>

          <div className="selected-actors">
            {selectedActors.map((actor) => (
              <div key={actor.id} className="selected-actor-tag">
                {actor.name}
                <button 
                  type="button" 
                  onClick={() => removeActor(actor.id)}
                  className="remove-actor"
                >
                  ×
                </button>
              </div>
            ))}
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
