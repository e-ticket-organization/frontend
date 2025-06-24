import React, { useState, useEffect } from 'react';
import { ICity } from '@/app/types/city';
import { ITheater } from '@/app/types/theater';
import { IPerfomance } from '@/app/types/perfomance';
import { getCities, getTheatersByCity, getShows, getShowsByFilters } from '@/app/services/filmService';
import Spinner from '../ui/Spinner';
import './CityTheaterSelector.styles.css';

interface CityTheaterSelectorProps {
  selectedPerformance: IPerfomance | null;
  onSelectionComplete: (cityId: number, theaterId: number) => void;
  onBack?: () => void;
  isLoading?: boolean;
}

export default function CityTheaterSelector({ 
  selectedPerformance, 
  onSelectionComplete, 
  onBack,
  isLoading = false
}: CityTheaterSelectorProps) {
  const [cities, setCities] = useState<{city: ICity, showsCount: number}[]>([]);
  const [theaters, setTheaters] = useState<{theater: ITheater, showsCount: number}[]>([]);
  const [selectedCityId, setSelectedCityId] = useState<number | null>(null);
  const [selectedTheaterId, setSelectedTheaterId] = useState<number | null>(null);
  const [loadingCities, setLoadingCities] = useState(true);
  const [loadingTheaters, setLoadingTheaters] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedPerformance?.id) {
      fetchCitiesWithShows();
    }
  }, [selectedPerformance?.id]);

  const fetchCitiesWithShows = async () => {
    try {
      setLoadingCities(true);
      setError(null);
      
      // Отримуємо всі покази для цієї вистави
      const result = await getShows(1, 1000);
      const allShows = result?.shows || [];
      const performanceShows = allShows.filter(show => 
        show.performance_id === selectedPerformance?.id && 
        new Date(show.datetime) > new Date()
      );

      // Групуємо по містах
      const cityMap = new Map<number, {city: ICity, showsCount: number}>();
      
      performanceShows.forEach(show => {
        if (show.city) {
          if (!cityMap.has(show.city.id)) {
            cityMap.set(show.city.id, {
              city: show.city,
              showsCount: 0
            });
          }
          cityMap.get(show.city.id)!.showsCount++;
        }
      });

      const citiesArray = Array.from(cityMap.values());
      console.log('Міста з показами для вистави:', citiesArray);
      setCities(citiesArray);
    } catch (err: any) {
      setError('Помилка завантаження міст');
      console.error('Помилка завантаження міст:', err);
    } finally {
      setLoadingCities(false);
    }
  };

  const handleCitySelect = async (cityId: number) => {
    try {
      setSelectedCityId(cityId);
      setSelectedTheaterId(null);
      setTheaters([]);
      setLoadingTheaters(true);
      setError(null);

      // Отримуємо покази для цієї вистави в цьому місті
      const result = await getShows(1, 1000);
      const allShows = result?.shows || [];
      const cityShows = allShows.filter(show => 
        show.performance_id === selectedPerformance?.id && 
        show.city_id === cityId &&
        new Date(show.datetime) > new Date()
      );

      // Групуємо по театрах
      const theaterMap = new Map<number, {theater: ITheater, showsCount: number}>();
      
      cityShows.forEach(show => {
        if (show.theater) {
          if (!theaterMap.has(show.theater.id)) {
            theaterMap.set(show.theater.id, {
              theater: show.theater,
              showsCount: 0
            });
          }
          theaterMap.get(show.theater.id)!.showsCount++;
        }
      });

      const theatersArray = Array.from(theaterMap.values());
      console.log('Театри з показами для вистави в місті:', theatersArray);
      setTheaters(theatersArray);
    } catch (err: any) {
      setError('Помилка завантаження театрів');
      console.error('Помилка завантаження театрів:', err);
    } finally {
      setLoadingTheaters(false);
    }
  };

  const handleTheaterSelect = (theaterId: number) => {
    setSelectedTheaterId(theaterId);
  };

  const handleProceed = () => {
    if (selectedCityId && selectedTheaterId) {
      onSelectionComplete(selectedCityId, selectedTheaterId);
    }
  };

  if (loadingCities) {
    return (
      <div className="city-theater-selector">
        <h2>Виберіть місто та театр</h2>
        <div className="loading-container">
          <Spinner />
          <p>Завантаження міст...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="city-theater-selector">
        <h2>Виберіть місто та театр</h2>
        <div className="error-message">
          <p>{error}</p>
          <button onClick={fetchCitiesWithShows} className="retry-button">
            Спробувати знову
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="city-theater-selector">
    
      <h2>{selectedPerformance?.title}</h2>
      <p className="subtitle">Виберіть місто та театр для перегляду доступних показів</p>

      <div className="selection-container">
        <div className="cities-section">
          <h3>Оберіть місто:</h3>
          <div className="cities-grid">
            {cities.map((cityData) => (
              <button
                key={cityData.city.id}
                className={`city-card ${selectedCityId === cityData.city.id ? 'selected' : ''}`}
                onClick={() => handleCitySelect(cityData.city.id)}
                disabled={isLoading}
              >
                <span className="city-name">{cityData.city.name}</span>
                <span className="shows-count">({cityData.showsCount} показів)</span>
              </button>
            ))}
          </div>
        </div>

        {selectedCityId && (
          <div className="theaters-section">
            <h3>Оберіть театр:</h3>
            {loadingTheaters ? (
              <div className="loading-container">
                <Spinner />
                <p>Завантаження театрів...</p>
              </div>
            ) : theaters.length > 0 ? (
              <div className="theaters-grid">
                {theaters.map((theaterData) => (
                  <button
                    key={theaterData.theater.id}
                    className={`theater-card ${selectedTheaterId === theaterData.theater.id ? 'selected' : ''}`}
                    onClick={() => handleTheaterSelect(theaterData.theater.id)}
                    disabled={isLoading}
                  >
                    <div className="theater-name">{theaterData.theater.name}</div>
                    {theaterData.theater.address && (
                      <div className="theater-address">{theaterData.theater.address}</div>
                    )}
                    <div className="shows-count">({theaterData.showsCount} показів)</div>
                  </button>
                ))}
              </div>
            ) : (
              <p className="no-theaters">У цьому місті немає доступних театрів</p>
            )}
          </div>
        )}

        {selectedCityId && selectedTheaterId && (
          <div className="proceed-section">
            <button 
              onClick={handleProceed} 
              className="proceed-button"
              disabled={isLoading}
            >
              {isLoading ? 'Завантаження...' : 'Переглянути покази'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 