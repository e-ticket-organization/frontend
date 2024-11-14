'use client';

import React, { useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import './favorite.styles.css';
import { getPerfomances } from '@/app/services/filmService';
import { IPerfomance } from '@/app/types/perfomance';
import BookingModal from '@/components/booking/BookingModal';
import { useRouter } from 'next/navigation';

export default function Favorite() {
  const router = useRouter();
  const [emblaRef] = useEmblaCarousel({ loop: true }, [Autoplay({ delay: 6000 })]);
  const [perfomances, setPerfomances] = useState<IPerfomance[]>([]);
  const [randomPerfomances, setRandomPerfomances] = useState<IPerfomance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPerformance, setSelectedPerformance] = useState<IPerfomance | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const performancesData = await getPerfomances();
        setPerfomances(performancesData);
        
        const shuffled = [...performancesData].sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, 6);
        setRandomPerfomances(selected);
      } catch (error) {
        console.error('Помилка завантаження даних:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const handleBookingClick = (performance: IPerfomance) => {
    setSelectedPerformance(performance);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPerformance(null);
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
              <img className='favorite-img' src={performance.image} alt={performance.title} />
              <div className='favorite-wrapper'>
                <div className='favorite-block-container'>
                  <div className='favorite-trending-block'>
                    <p>Популярне</p>
                  </div>
                  <div className='favorite-block'>
                    <h2>{performance.title}</h2>
                    <div className='favorite-button-container'>
                      <button id='button1' onClick={() => handleBookingClick(performance)}>
                        Придбати
                      </button>
                      <button id='button2' onClick={() => handleDetailsClick(performance)}>
                        Детальніше
                      </button>
                    </div>
                  </div>
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
    </section>
  );
}