'use client';

import React, { useEffect, useState } from 'react';
import './performance-individual.styles.css';
import { IPerfomance } from '@/app/types/perfomance';
import { IShow } from '@/app/types/show';
import { IGenre } from '@/app/types/genre';
import BookingModal from '@/components/booking/BookingModal';
import { getShowsByPerformance } from '@/app/services/filmService';

interface PerformanceIndividualProps {
  performance: IPerfomance;
}

export default function PerformanceIndividual({ performance }: PerformanceIndividualProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [shows, setShows] = useState<IShow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchShows = async () => {
      try {
        if (performance.id) {
          const showsData = await getShowsByPerformance(Number(performance.id));
          const futureShows = showsData.filter(show => new Date(show.datetime) > new Date());
          setShows(futureShows.sort((a, b) => 
            new Date(a.datetime).getTime() - new Date(b.datetime).getTime()
          ));
        }
      } catch (error) {
        console.error('Помилка завантаження показів:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchShows();
  }, [performance.id]);

  const handleBookingClick = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  if (isLoading) {
    return (
      <div className="loader-container">
        <div className="loader"></div>
      </div>
    );
  }

  return (
    <section className='hero'>
      <div className="hero__container">
        <div className="hero__content">
          <img 
            className='hero-img' 
            src={performance.image} 
            alt={performance.title} 
          />
          <div className='hero-wrapper'>
            <div className='hero-block-container'>
              <h2>{performance.title}</h2>
              <div className='hero-block'>
                <p className='hero-block-text'>Тривалість: {performance.duration} хв</p>
                
                {performance.producer && (
                  <p className='hero-block-text'>
                    Режисер: {performance.producer.first_name} {performance.producer.last_name}
                  </p>
                )}

                {performance.actors && performance.actors.length > 0 && (
                  <div className='actors-section'>
                    <p className='hero-block-text'>Актори:</p>
                    <div className='actors-list'>
                      {performance.actors.map(actor => (
                        <span key={actor.id} className="actor-tag">
                          {actor.first_name} {actor.last_name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <p className="next-show">
                  {shows.length > 0 ? 
                    `Наступний показ: ${new Date(shows[0].datetime).toLocaleString('uk-UA')}` : 
                    'На жаль, наразі немає запланованих показів'}
                </p>
                {performance.genres && performance.genres.length > 0 && (
                  <div className="genres">
                    {performance.genres.map((genre: IGenre) => (
                      <p className='hero-block-text'>
                        Жанр:
                        <span key={genre.id} className="genre-tag">
                           {genre.name}
                        </span>
                      </p>
                    ))}
                  </div>
                )}
                {shows.length > 0 ? (
                  <button 
                    id='hero-button1' 
                    onClick={handleBookingClick}
                  >
                    Придбати квитки
                  </button>
                ) : (
                  <button 
                    id='hero-button1' 
                    disabled
                    title="Наразі немає запланованих показів"
                  >
                    Квитки недоступні
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {shows.length > 0 && (
        <BookingModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          selectedPerformance={performance}
        />
      )}
    </section>
  );
}