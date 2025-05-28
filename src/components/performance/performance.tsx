'use client';
import React, { useEffect, useState } from 'react';
import './performance.styles.css';
import { IPerfomance } from '@/app/types/perfomance';
import { IGenre } from '@/app/types/genre';
import { IShow } from '@/app/types/show';
import { getToken } from '@/app/services/authService';
import { useRouter } from 'next/navigation';
import { getPerfomances, getPerfomancesWithFilters, getGenres, getShows } from '@/app/services/filmService';

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
    const [shows, setShows] = useState<Record<number, IShow[]>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [sortBy, setSortBy] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedGenre, setSelectedGenre] = useState('');
    const router = useRouter();

    useEffect(() => {
        fetchGenres();
        fetchData();
    }, [sortBy, searchTerm, selectedGenre]);

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
    
    const fetchAllShows = async () => {
        try {
            const allShows = await getShows();
            console.log('Отримані всі покази:', allShows);
            
            const groupedShows: Record<number, IShow[]> = {};
            allShows.forEach(show => {
                if (!groupedShows[show.performance_id]) {
                    groupedShows[show.performance_id] = [];
                }
                groupedShows[show.performance_id].push(show);
            });
            
            setShows(groupedShows);
        } catch (error) {
            console.error('Помилка завантаження показів:', error);
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
            .map(show => show.datetime)
            .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    };

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const url = '/performances?';
            
            console.log('URL запиту:', url);
            
            const data = await getPerfomancesWithFilters(url);
            console.log('Отримані вистави:', data);

            if (data && Array.isArray(data)) {
                setPerformances(data);
                await fetchAllShows();
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
        const matchesGenre = selectedGenre ? performance.genres.some(genre => genre.id === Number(selectedGenre)) : true;
        const matchesSearchTerm = performance.title.toLowerCase().includes(searchTerm.toLowerCase());
        const hasFutureShows = hasUpcomingShows(performance.id);
        return matchesGenre && matchesSearchTerm && hasFutureShows;
    });

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