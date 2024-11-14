'use client';
import React, { useEffect, useState } from 'react';
import './performance-relises.styles.css';
import { IPerfomance } from '@/app/types/perfomance';
import { IGenre } from '@/app/types/genre';
import { IShow } from '@/app/types/show';
import { getToken } from '@/app/services/authService';
import { useRouter } from 'next/navigation';
import { getPerfomances, getPerfomancesWithFilters, getGenres, getShowsByPerformance } from '@/app/services/filmService';

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

    const fetchShowsForPerformance = async (performanceId: number | undefined) => {
        if (!performanceId) return;
        try {
            const showsData = await getShowsByPerformance(performanceId);
            setShows(prev => ({
                ...prev,
                [performanceId]: showsData
            }));
        } catch (error) {
            console.error(`Помилка завантаження показів для вистави ${performanceId}:`, error);
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

    const isRecentlyAdded = (performance: PerformanceWithGenres): boolean => {
        if (!performance.created_at) return false;
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const createdDate = new Date(performance.created_at);
        return createdDate > oneWeekAgo;
    };

    const fetchData = async () => {
        setIsLoading(true);
        try {
            let url = '/performances?';
            const params = [];

            if (sortBy === 'price_asc') {
                params.push('sort_price=asc');
            } else if (sortBy === 'price_desc') {
                params.push('sort_price=desc');
            } else if (sortBy === 'date_asc') {
                params.push('sort_date=asc');
            } else if (sortBy === 'date_desc') {
                params.push('sort_date=desc');
            }

            if (searchTerm) {
                params.push(`search=${searchTerm}`);
            }
            if (selectedGenre) {
                params.push(`genre_id=${selectedGenre}`);
            }

            url += params.join('&');
            
            const data = await getPerfomancesWithFilters(url);
            const recentPerformances = data.filter(isRecentlyAdded);
            setPerformances(recentPerformances);
            await Promise.all(recentPerformances.map(perf => fetchShowsForPerformance(perf.id)));
        } catch (error) {
            console.error('Помилка завантаження даних:', error);
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
            ) : performances.length > 0 ? (
                <div className="performances-grid">
                    {performances.map((performance) => (
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
                                    target.src = '/placeholder-image.jpg';
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
                    <p>Немає нових вистав за останній тиждень</p>
                </div>
            )}
        </div>
    );
}