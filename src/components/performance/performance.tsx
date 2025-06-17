'use client';
import React, { useEffect, useState } from 'react';
import './performance.styles.css';
import { IPerfomance } from '@/app/types/perfomance';
import { IGenre } from '@/app/types/genre';
import { IShow } from '@/app/types/show';
import { getToken } from '@/app/services/authService';
import { useRouter } from 'next/navigation';
import { getPerfomances, getPerfomancesWithFilters, getGenres, getShows, getCitiesWithShows, getCitiesWithUpcomingShows, getTheatersWithShows, getPerformancesWithLocationFilters, getShowsByFilters } from '@/app/services/filmService';
import { ICity } from '@/app/types/city';
import { ITheater } from '@/app/types/theater';

interface PerformanceWithGenres extends IPerfomance {
    genres: {
        id: number;
        name: string;
    }[];
}

function PerformanceCard({ performance, handlePerformanceClick, hasUpcomingShows, getMinPrice, getNextShowDate, showDates }: { 
    performance: PerformanceWithGenres, 
    handlePerformanceClick: (id: number) => void, 
    hasUpcomingShows: (id: number | undefined) => boolean, 
    getMinPrice: (id: number | undefined) => number | null, 
    getNextShowDate: (id: number | undefined) => string,
    showDates: string[]
}) {
    return (
        <div 
            key={performance.id} 
            className="performance-card"
            onClick={() => handlePerformanceClick(Number(performance.id))}
        >
            <img 
                src={performance.image} 
                alt={performance.title} 
            />
            <h3>{performance.title}</h3>
            <p>Тривалість: {performance.duration} хв</p>
            {hasUpcomingShows(performance.id) ? (
                <>
                    {getMinPrice(performance.id) && (
                        <p className="price">Ціна від: {getMinPrice(performance.id)} грн</p>
                    )}
                    <p className="next-show">Наступний показ: {getNextShowDate(performance.id)}</p>
                </>
            ) : (
                <p className="no-shows">Немає запланованих показів</p>
            )}
            {performance.genres && performance.genres.length > 0 && (
                <div className="genres">
                    {performance.genres.map((genre: IGenre) => (
                        <span key={genre.id} className="genre-tag">
                            {genre.name}
                        </span>
                    ))}
                </div>
            )}
            {showDates.length > 0 && (
                <div className="show-dates">
                    <h4>Дати показів:</h4>
                    {showDates.map((date, index) => (
                        <p key={index}>{new Date(date).toLocaleString('uk-UA')}</p>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function PerformanceMain() {
    const [performances, setPerformances] = useState<PerformanceWithGenres[]>([]);
    const [genres, setGenres] = useState<IGenre[]>([]);
    const [cities, setCities] = useState<ICity[]>([]);
    const [theaters, setTheaters] = useState<ITheater[]>([]);
    const [shows, setShows] = useState<Record<number, IShow[]>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [sortBy, setSortBy] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedGenre, setSelectedGenre] = useState('');
    const [selectedCity, setSelectedCity] = useState('');
    const [selectedTheater, setSelectedTheater] = useState('');
    const router = useRouter();

    useEffect(() => {
        fetchGenres();
        fetchCities();
        fetchData();
    }, []);

    useEffect(() => {
        fetchData();
    }, [sortBy, searchTerm, selectedGenre, selectedCity, selectedTheater]);

    useEffect(() => {
        if (selectedCity) {
            fetchTheaters(Number(selectedCity));
        } else {
            setTheaters([]);
            setSelectedTheater('');
        }
    }, [selectedCity]);

    const fetchGenres = async () => {
        try {
            const response = await fetch('https://backend-3ih2.onrender.com/api/genres', {
                method: 'GET',
                headers: {
                    'Accept': '*/*'
                }
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const genresData = await response.json();
            console.log('Жанри отримані з API:', genresData);
            setGenres(Array.isArray(genresData) ? genresData : []);
        } catch (error) {
            console.error('Помилка завантаження жанрів:', error);
        }
    };

    const fetchCities = async () => {
        try {
            // Використовуємо міста з майбутніми показами для кращого UX
            const citiesData = await getCitiesWithUpcomingShows();
            console.log('Міста з майбутніми показами отримані:', citiesData);
            setCities(citiesData);
        } catch (error) {
            console.error('Помилка завантаження міст:', error);
            // Якщо новий ендпоінт не працює, використаємо старий
            try {
                const fallbackCitiesData = await getCitiesWithShows();
                console.log('Міста з виставами отримані (fallback):', fallbackCitiesData);
                setCities(fallbackCitiesData);
            } catch (fallbackError) {
                console.error('Помилка завантаження міст (fallback):', fallbackError);
            }
        }
    };

    const fetchTheaters = async (cityId: number) => {
        try {
            setTheaters([]); // Очищуємо попередні театри
            const theatersData = await getTheatersWithShows(cityId);
            console.log('Театри з показами отримані:', theatersData);
            setTheaters(Array.isArray(theatersData) ? theatersData : []);
        } catch (error) {
            console.error('Помилка завантаження театрів:', error);
            setTheaters([]); // Встановлюємо порожній масив при помилці
        }
    };
    
    const fetchAllShows = async () => {
        try {
            const result = await getShows(1, 1000);
            console.log('Отримані всі покази:', result);
            
            const groupedShows: Record<number, IShow[]> = {};
            
            if (result && result.shows && Array.isArray(result.shows)) {
                result.shows.forEach(show => {
                    if (!groupedShows[show.performance_id]) {
                        groupedShows[show.performance_id] = [];
                    }
                    groupedShows[show.performance_id].push(show);
                });
            }
            
            setShows(groupedShows);
        } catch (error) {
            console.error('Помилка завантаження показів:', error);
        }
    };

    const fetchFilteredShows = async (filters: {
        search?: string;
        genre?: string;
        cityId?: number;
        theaterId?: number;
        limit?: number;
        page?: number;
    }) => {
        try {
            // Якщо є фільтри по місту або театру, завантажуємо тільки відповідні покази
            if (filters.cityId || filters.theaterId) {
                const filteredShows = await getShowsByFilters({
                    cityId: filters.cityId,
                    theaterId: filters.theaterId
                });
                console.log('Отримані відфільтровані покази:', filteredShows);
                
                const groupedShows: Record<number, IShow[]> = {};
                filteredShows.forEach((show: IShow) => {
                    if (!groupedShows[show.performance_id]) {
                        groupedShows[show.performance_id] = [];
                    }
                    groupedShows[show.performance_id].push(show);
                });
                
                setShows(groupedShows);
            } else {
                // Якщо немає фільтрів по місцю, завантажуємо всі покази
                await fetchAllShows();
            }
        } catch (error) {
            console.error('Помилка завантаження відфільтрованих показів:', error);
            // Fallback до всіх показів
            await fetchAllShows();
        }
    };

    const getMinPrice = (performanceId: number | undefined): number | null => {
        if (!performanceId) return null;
        const performanceShows = shows[performanceId] || [];
        if (performanceShows.length === 0) return null;
        const prices = performanceShows.map(show => Number(show.price)).filter(price => price > 0);
        return prices.length > 0 ? Math.min(...prices) : null;
    };

    const hasUpcomingShows = (performanceId: number | undefined): boolean => {
        if (!performanceId) return false;
        const performanceShows = shows[performanceId] || [];
        return performanceShows.some(show => new Date(show.datetime) > new Date());
    };

    const getNextShowDate = (performanceId: number | undefined): string => {
        if (!performanceId) return 'Немає запланованих показів';
        const performanceShows = shows[performanceId] || [];
        if (performanceShows.length === 0) return 'Немає запланованих показів';
        
        const dates = performanceShows
            .map(show => new Date(show.datetime))
            .filter(date => date > new Date())
            .sort((a, b) => a.getTime() - b.getTime());
        
        if (dates.length === 0) return 'Немає запланованих показів';
        
        return dates[0].toLocaleString('uk-UA', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Функція для отримання тільки майбутніх дат показів
    const getFutureShowDates = (performanceId: number | undefined): string[] => {
        if (!performanceId) return [];
        const performanceShows = shows[performanceId] || [];
        return performanceShows
            .filter(show => new Date(show.datetime) > new Date())
            .map(show => show.datetime.toString())
            .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    };

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const filters = {
                search: searchTerm || undefined,
                genre: selectedGenre || undefined,
                cityId: selectedCity ? Number(selectedCity) : undefined,
                theaterId: selectedTheater ? Number(selectedTheater) : undefined,
                limit: 40,
                page: 1
            };

            console.log('Фільтри для запиту:', filters);
            
            const data = await getPerformancesWithLocationFilters(filters);
            console.log('Отримані вистави з фільтрами:', data);

            if (data && Array.isArray(data)) {
                setPerformances(data);
                await fetchFilteredShows(filters);
            } else {
                console.error('Неочікувана структура відповіді:', data);
                setPerformances([]);
            }
        } catch (error) {
            console.error('Помилка завантаження вистав:', error);
            setPerformances([]);
        } finally {
            setIsLoading(false);
        }
    };
    

    const hasPerformancesWithPrice = (): boolean => {
        return performances.some(performance => {
            const performanceShows = shows[performance.id || 0] || [];
            return performanceShows.some(show => Number(show.price) > 0);
        });
    };

    const handlePerformanceClick = (performanceId: number) => {
        router.push(`/performances/${performanceId}`);
    };

    const filteredPerformances = performances.filter(performance => {
        const hasFutureShows = hasUpcomingShows(performance.id);
        return hasFutureShows;
    });

    console.log('🎭 Всього вистав з сервера:', performances.length);
    console.log('🎭 Після клієнтської фільтрації:', filteredPerformances.length);
    console.log('🎭 Поточні фільтри:', { selectedCity, selectedTheater, selectedGenre, searchTerm });

    return (
        <div className='performance-main'>
            <div className="filters">
                <input 
                    type="text" 
                    placeholder="Пошук вистав..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                
                <select 
                    value={selectedCity} 
                    onChange={(e) => {
                        setSelectedCity(e.target.value);
                        setSelectedTheater(''); // Скидаємо театр при зміні міста
                    }}
                >
                    <option value="">Всі міста</option>
                    {cities.map(city => (
                        <option key={city.id} value={city.id}>
                            {city.name}
                        </option>
                    ))}
                </select>

                <select 
                    value={selectedTheater} 
                    onChange={(e) => setSelectedTheater(e.target.value)}
                    disabled={!selectedCity}
                >
                    <option value="">
                        {selectedCity ? 'Всі театри в місті' : 'Спочатку виберіть місто'}
                    </option>
                    {theaters && theaters.length > 0 ? (
                        theaters.map(theater => (
                            <option key={theater.id} value={theater.id}>
                                {theater.name}
                            </option>
                        ))
                    ) : selectedCity ? (
                        <option disabled>Немає доступних театрів</option>
                    ) : null}
                </select>
                
                <select 
                    value={selectedGenre} 
                    onChange={(e) => setSelectedGenre(e.target.value)}
                >
                    <option value="">Всі жанри</option>
                    {genres.map(genre => (
                        <option key={genre.id} value={genre.id}>
                            {genre.name}
                        </option>
                    ))}
                </select>
                
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                    <option value="">Сортувати за...</option>
                    {hasPerformancesWithPrice() && (
                        <>
                            <option value="price_asc">Ціна (від низької до високої)</option>
                            <option value="price_desc">Ціна (від високої до низької)</option>
                        </>
                    )}
                    <option value="date_asc">Дата (старіші спочатку)</option>
                    <option value="date_desc">Дата (новіші спочатку)</option>
                </select>
            </div>

            {isLoading ? (
                <div className="loader-container">
                    <div className="loader"></div>
                </div>
            ) : (
                <div className="performances-grid">
                    {filteredPerformances.map((performance) => (
                        <PerformanceCard 
                            key={performance.id} 
                            performance={performance} 
                            handlePerformanceClick={handlePerformanceClick}
                            hasUpcomingShows={hasUpcomingShows}
                            getMinPrice={getMinPrice}
                            getNextShowDate={getNextShowDate}
                            showDates={getFutureShowDates(performance.id)}
                        />
                    ))}
                </div>
            )}
        </div>
    );

}