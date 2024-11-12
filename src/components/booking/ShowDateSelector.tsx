import React from 'react';
import { IShow } from '@/app/types/show';
import { IPerfomance } from '@/app/types/perfomance';
import Spinner from '../ui/Spinner'; 
import './ShowDateSelector.styles.css';

interface ShowDateSelectorProps {
    shows: IShow[];
    onShowSelect: (show: IShow) => void;
    selectedPerformance: IPerfomance | null;
    isLoading: boolean;
}

export default function ShowDateSelector({ 
    shows, 
    onShowSelect,
    selectedPerformance,
    isLoading
}: ShowDateSelectorProps) {
    const sortedShows = [...shows].sort((a, b) => 
        new Date(a.datetime).getTime() - new Date(b.datetime).getTime()
    );

    const groupedShows = sortedShows.reduce((acc, show) => {
        const date = new Date(show.datetime).toLocaleDateString('uk-UA', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        if (!acc[date]) {
            acc[date] = [];
        }
        acc[date].push(show);
        return acc;
    }, {} as Record<string, IShow[]>);

    Object.values(groupedShows).forEach(dateShows => {
        dateShows.sort((a, b) => 
            new Date(a.datetime).getTime() - new Date(b.datetime).getTime()
        );
    });

    if (shows.length === 0 && !isLoading) {
        return (
            <div className="show-date-selector">
                <h2 className='show-title'>{selectedPerformance?.title}</h2>
                <p className="no-shows">На жаль, наразі немає доступних показів</p>
            </div>
        );
    }

    return (
        <div className="show-date-selector">
            <h2>{selectedPerformance?.title}</h2>
            <div className="dates-container">
                {isLoading ? (
                    <div className="loading-container">
                        <Spinner />
                    </div>
                ) : (
                    Object.entries(groupedShows).map(([date, dateShows]) => (
                        <div key={date} className="date-group">
                            <h3>{date}</h3>
                            <div className="time-slots-container">
                                {dateShows.map(show => (
                                    <button
                                        key={show.id}
                                        className="time-slot"
                                        onClick={() => onShowSelect(show)}
                                    >
                                        {new Date(show.datetime).toLocaleTimeString('uk-UA', {
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
