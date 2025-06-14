import React, { useState } from 'react';
import useCities from '@/hooks/useCities';
import { ICity } from '@/app/types/city';
import './CitiesWithShows.styles.css';

interface CitiesWithShowsProps {
  showUpcomingOnly?: boolean;
}

export default function CitiesWithShows({ showUpcomingOnly = false }: CitiesWithShowsProps) {
  const [selectedCityId, setSelectedCityId] = useState<number | null>(null);
  const [selectedCity, setSelectedCity] = useState<ICity | null>(null);

  const { 
    cities, 
    isLoading, 
    error, 
    fetchCityWithShows 
  } = useCities({ 
    includeShows: true, 
    upcomingOnly: showUpcomingOnly 
  });

  const handleCitySelect = async (cityId: number) => {
    try {
      setSelectedCityId(cityId);
      const cityData = await fetchCityWithShows(cityId, showUpcomingOnly);
      setSelectedCity(cityData);
    } catch (error) {
      console.error('Помилка завантаження деталей міста:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="cities-with-shows">
        <h2>{showUpcomingOnly ? 'Міста з майбутніми показами' : 'Міста з показами'}</h2>
        <div className="loading">Завантаження...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="cities-with-shows">
        <h2>{showUpcomingOnly ? 'Міста з майбутніми показами' : 'Міста з показами'}</h2>
        <div className="error">Помилка: {error}</div>
      </div>
    );
  }

  return (
    <div className="cities-with-shows">
      <h2>{showUpcomingOnly ? 'Міста з майбутніми показами' : 'Міста з показами'}</h2>
      
      <div className="cities-grid">
        {cities.map((city) => (
          <div 
            key={city.id} 
            className={`city-card ${selectedCityId === city.id ? 'selected' : ''}`}
            onClick={() => handleCitySelect(city.id)}
          >
            <h3>{city.name}</h3>
            <div className="city-stats">
              {showUpcomingOnly ? (
                <span>
                  Майбутніх показів: {city.upcomingShowsCount || city.upcomingShows?.length || 0}
                </span>
              ) : (
                <span>
                  Всього показів: {city.showsCount || city.shows?.length || 0}
                </span>
              )}
              {city.theaters && (
                <span>Театрів: {city.theaters.length}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {selectedCity && (
        <div className="city-details">
          <h3>Деталі міста: {selectedCity.name}</h3>
          
          {selectedCity.theaters && selectedCity.theaters.length > 0 && (
            <div className="theaters-section">
              <h4>Театри:</h4>
              <ul>
                {selectedCity.theaters.map((theater) => (
                  <li key={theater.id}>
                    <strong>{theater.name}</strong>
                    {theater.address && <span> - {theater.address}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {(selectedCity.shows || selectedCity.upcomingShows) && (
            <div className="shows-section">
              <h4>{showUpcomingOnly ? 'Майбутні покази:' : 'Покази:'}</h4>
              <div className="shows-list">
                {(showUpcomingOnly ? selectedCity.upcomingShows : selectedCity.shows)?.map((show) => (
                  <div key={show.id} className="show-item">
                    <div className="show-performance">
                      {show.performance?.title || `Показ #${show.id}`}
                    </div>
                    <div className="show-details">
                      <span>Дата: {new Date(show.datetime).toLocaleDateString('uk-UA')}</span>
                      <span>Час: {new Date(show.datetime).toLocaleTimeString('uk-UA')}</span>
                      <span>Ціна: {show.price} грн</span>
                    </div>
                    {show.theater && (
                      <div className="show-theater">
                        Театр: {show.theater.name}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 