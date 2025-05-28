'use client';
import React, { useEffect, useState } from 'react';
import './performance-relises.styles.css';
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

export default function PerformanceRelises() {
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
            const genresData = await getGenres();
            setGenres(genresData);
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

    const isSpecificDate = (performance: PerformanceWithGenres): boolean => {
        const specificDate = new Date('2025-04-26T07:06:06.000Z');
        if (!performance.created_at) return false;
        const createdDate = new Date(performance.created_at);
        return createdDate.getTime() === specificDate.getTime();
    };

    const fetchData = async () => {
        setIsLoading(true);
        try {
        const searchQuery = searchTerm ? `&search=${encodeURIComponent(searchTerm)}` : '';
        const url = `https://backend-3ih2.onrender.com/api/performances?limit=40&page=1${searchQuery}`;

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const data = await response.json();
        
        setPerformances(data.items);
        await fetchAllShows();
        } catch (error) {
            console.error('Помилка завантаження даних:', error);
        } finally {
            setIsLoading(false);
        }
    };

const getFilteredAndSortedPerformances = () => {
    let filtered = [...performances];

    // Фільтрація за останній місяць
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    filtered = filtered.filter(performance => {
        if (!performance.created_at) return false; // Перевірка на null
        const createdDate = new Date(performance.created_at);
        return createdDate >= oneMonthAgo; // Вистава створена за останній місяць
    });

    // Фільтрація за наявністю майбутніх показів
    filtered = filtered.filter(performance => hasUpcomingShows(performance.id));

    // Фільтрація за жанром
    if (selectedGenre) {
        filtered = filtered.filter(performance => 
            performance.genres.some(genre => genre.id.toString() === selectedGenre)
        );
    }

    // Сортування
    if (sortBy === 'date_asc') {
        filtered.sort((a, b) => {
            const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
            const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
            return dateA - dateB;
        });
    } else if (sortBy === 'date_desc') {
        filtered.sort((a, b) => {
            const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
            const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
            return dateB - dateA;
        });
    } else if (sortBy === 'price_asc') {
        filtered.sort((a, b) => {
            const priceA = getMinPrice(a.id) || Infinity;
            const priceB = getMinPrice(b.id) || Infinity;
            return priceA - priceB;
        });
    } else if (sortBy === 'price_desc') {
        filtered.sort((a, b) => {
            const priceA = getMinPrice(a.id) || 0;
            const priceB = getMinPrice(b.id) || 0;
            return priceB - priceA;
        });
    }

    return filtered;
};

const hasPerformancesWithPrice = (): boolean => {
    return performances.some((performance: PerformanceWithGenres) => {
        const performanceShows = shows[performance.id] || [];
        return performanceShows.some((show: IShow) => Number(show.price) > 0);
        });
    };

    const handlePerformanceClick = (performanceId: number) => {
        router.push(`/performance/${performanceId}`);
    };

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
                {genres.map((genre: IGenre) => (
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
            ) : performances.length > 0 ? (
                <div className="performances-grid">
                {getFilteredAndSortedPerformances().map((performance: PerformanceWithGenres) => (
                        <div 
                            key={performance.id} 
                            className="performance-card"
                            onClick={() => handlePerformanceClick(Number(performance.id))}
                        >
                            <img 
                                src={performance.image} 
                                alt={performance.title} 
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const errorText = document.createElement('p');
                                errorText.innerText = 'Невдалося знайти';
                                errorText.className = 'error-text';
                                target.parentNode?.appendChild(errorText);
                                }}
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
                        </div>
                    ))}
                </div>
            ) : (
                <div className="no-performances">
                <p>Немає нових вистав за останній місяць з майбутніми показами</p>
                </div>
            )}
        </div>
    );
}