import { useState, useEffect } from 'react';
import { ICity } from '@/app/types/city';
import { 
  getCities, 
  getCitiesWithShows, 
  getCitiesWithUpcomingShows,
  getCityWithShows,
  getCityWithUpcomingShows 
} from '@/app/services/filmService';

interface UseCitiesOptions {
  includeShows?: boolean;
  upcomingOnly?: boolean;
  autoFetch?: boolean;
}

export const useCities = (options: UseCitiesOptions = {}) => {
  const { includeShows = false, upcomingOnly = false, autoFetch = true } = options;
  
  const [cities, setCities] = useState<ICity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCities = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      let citiesData: ICity[];
      
      if (includeShows && upcomingOnly) {
        citiesData = await getCitiesWithUpcomingShows();
      } else if (includeShows) {
        citiesData = await getCitiesWithShows();
      } else {
        citiesData = await getCities();
      }
      
      setCities(citiesData);
    } catch (err: any) {
      setError(err.message || 'Помилка завантаження міст');
      console.error('Помилка завантаження міст:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCityWithShows = async (cityId: number, upcomingOnly: boolean = false) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const cityData = upcomingOnly 
        ? await getCityWithUpcomingShows(cityId)
        : await getCityWithShows(cityId);
      
      return cityData;
    } catch (err: any) {
      setError(err.message || 'Помилка завантаження міста');
      console.error('Помилка завантаження міста:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const refetch = () => {
    fetchCities();
  };

  useEffect(() => {
    if (autoFetch) {
      fetchCities();
    }
  }, [includeShows, upcomingOnly, autoFetch]);

  return {
    cities,
    isLoading,
    error,
    fetchCities,
    fetchCityWithShows,
    refetch
  };
};

export default useCities; 