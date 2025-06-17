'use client';

import React, { useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import './favorite.styles.css';
import { getPerfomances } from '@/app/services/filmService';
import { IPerfomance } from '@/app/types/perfomance';
import BookingModal from '@/components/booking/BookingModal';
import { useRouter } from 'next/navigation';
import { getToken } from '@/app/services/authService';

export default function Favorite() {
  const router = useRouter();
  const [emblaRef] = useEmblaCarousel({ loop: true }, [Autoplay({ delay: 6000 })]);
  const [perfomances, setPerfomances] = useState<IPerfomance[]>([]);
  const [randomPerfomances, setRandomPerfomances] = useState<IPerfomance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPerformance, setSelectedPerformance] = useState<IPerfomance | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showAuthError, setShowAuthError] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const result = await getPerfomances({ limit: 10, page: 1 });
        
        if (result && result.performances && Array.isArray(result.performances) && result.performances.length > 0) {
          setPerfomances(result.performances);
          const randomData = [...result.performances]
            .sort(() => Math.random() - 0.5)
            .slice(0, 3);
          setRandomPerfomances(randomData);
        } else {
          setPerfomances([]);
          setRandomPerfomances([]);
        }
      } catch (error) {
        console.error('Помилка завантаження вистав у favorite:', error);
        setPerfomances([]);
        setRandomPerfomances([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const handleBookingClick = (performance: IPerfomance) => {
    const token = getToken();
    if (!token) {
      setShowAuthError(true);
      return;
    }
    setSelectedPerformance(performance);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPerformance(null);
  };

  const handleCloseAuthError = () => {
    setShowAuthError(false);
  };

  const handleDetailsClick = (performance: IPerfomance) => {
    router.push(`/performances/${performance.id}`);
  };

  if (isLoading) {
    return (
      <div className="loader-container">
        <div className="loader"></div>
      </div>
    );
  }

  return (
    <section className='favorite'>
      <div className="embla" ref={emblaRef}>
        <div className="embla__container">
          {randomPerfomances.map((performance) => (
            <div key={performance.id} className="embla__slide">
              <div className="card">
                <div className="image-container">
                  <img className='new-form-img' src={performance.image} alt={performance.title} />
                </div>
                <div className="content">
                  <div className="title">{performance.title}</div>
                  {performance.description && (
                    <div className="description">
                      {performance.description}
                    </div>
                  )}
                  <button className="button" onClick={() => handleBookingClick(performance)}>
                    Придбати
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <BookingModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        selectedPerformance={selectedPerformance}
      />

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
    </section>
  );
}