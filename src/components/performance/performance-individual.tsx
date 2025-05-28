'use client';

import React, { useEffect, useState } from 'react';
import { IPerfomance } from '@/app/types/perfomance';
import { IShow } from '@/app/types/show';
import { IGenre } from '@/app/types/genre';
import BookingModal from '@/components/booking/BookingModal';
import { getShows } from '@/app/services/filmService';
import { getToken } from '@/app/services/authService';
import './performance-individual.styles.css';

interface PerformanceIndividualProps {
  performance: IPerfomance;
}

export default function PerformanceIndividual({ performance }: PerformanceIndividualProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [shows, setShows] = useState<IShow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAuthError, setShowAuthError] = useState(false);

  useEffect(() => {
    const fetchShows = async () => {
      try {
        if (performance.id) {
          // Отримуємо всі покази та фільтруємо по performance_id та майбутній даті
          const allShows = await getShows();
          const performanceShows = allShows.filter(show => 
            show.performance_id === Number(performance.id) && 
            new Date(show.datetime) > new Date()
          );
          
          setShows(performanceShows.sort((a, b) => 
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
    const token = getToken();
    if (!token) {
      setShowAuthError(true);
      return;
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleCloseAuthError = () => {
    setShowAuthError(false);
  };

  if (isLoading) {
    return (
      <div className="loader-container">
        <div className="loader"></div>
      </div>
    );
  }

  return (
    <div className="performance-content">
      <img 
        className="performance-image" 
        src={performance.image} 
        alt={performance.title} 
      />
      
      <h1 className="performance-title">{performance.title}</h1>
      
      <div className="performance-info">
        <div className="performance-info-item">
          <span className="performance-info-label">Тривалість</span>
          <span className="performance-info-value">{performance.duration} хв</span>
        </div>
        
        {performance.producer && (
          <div className="performance-info-item">
            <span className="performance-info-label">Режисер</span>
            <span className="performance-info-value">
              {performance.producer.first_name} {performance.producer.last_name}
            </span>
          </div>
        )}
        
        {performance.actors && performance.actors.length > 0 && (
          <div className="performance-info-item">
            <span className="performance-info-label">Актори</span>
            <div className="performance-info-value">
              {performance.actors.map(actor => (
                <span key={actor.id} className="actor-tag">
                  {actor.first_name} {actor.last_name}
                </span>
              ))}
            </div>
          </div>
        )}
        
        {performance.genres && performance.genres.length > 0 && (
          <div className="performance-info-item">
            <span className="performance-info-label">Жанри</span>
            <div className="performance-info-value">
              {performance.genres.map((genre: IGenre) => (
                <span key={genre.id} className="genre-tag">
                  {genre.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="performance-description">
        <p className="next-show">
          {shows.length > 0 ? 
            `Наступний показ: ${new Date(shows[0].datetime).toLocaleString('uk-UA')}` : 
            'На жаль, наразі немає запланованих показів'}
        </p>
        
        {shows.length > 0 ? (
          <button 
            className="booking-button" 
            onClick={handleBookingClick}
          >
            Придбати квитки
          </button>
        ) : (
          <button 
            className="booking-button" 
            disabled
            title="Наразі немає запланованих показів"
          >
            Квитки недоступні
          </button>
        )}
      </div>

      {shows.length > 0 && (
        <BookingModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          selectedPerformance={performance}
        />
      )}

      {/* Попап помилки авторизації */}
      {showAuthError && (
        <div className="auth-error-overlay">
          <div className="auth-error-modal">
            <h3>Необхідна авторизація</h3>
            <p>Для бронювання квитків потрібно увійти в систему або зареєструватися.</p>
            <div className="auth-error-buttons">
              <button 
                className="auth-button login-button" 
                onClick={() => window.location.href = '/login'}
              >
                Увійти
              </button>
              <button 
                className="auth-button register-button" 
                onClick={() => window.location.href = '/register'}
              >
                Зареєструватися
              </button>
              <button 
                className="auth-button cancel-button" 
                onClick={handleCloseAuthError}
              >
                Скасувати
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}