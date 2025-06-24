'use client';

import React, { useEffect, Dispatch, SetStateAction } from 'react';
import './SeatsGrid.styles.css';
import Spinner from '../ui/Spinner';
import { ISeat } from '@/app/types/seat';
import { IShow } from '@/app/types/show';

interface SeatsGridProps {
    availableSeats: ISeat[];
    bookedSeats: ISeat[];
    selectedSeats: ISeat[];
    onSeatSelect: (seat: ISeat) => void;
    price: number;
    selectedShow: IShow | null;
    handleBooking: () => void;
    onClose: () => void;
    onBack?: () => void;
    setAvailableSeats: Dispatch<SetStateAction<ISeat[]>>;
    setBookedSeats: Dispatch<SetStateAction<ISeat[]>>;
    isLoading: boolean;
}

export default function SeatsGrid({ 
    availableSeats, 
    bookedSeats, 
    selectedSeats, 
    onSeatSelect,
    price,
    selectedShow,
    handleBooking,
    onClose,
    onBack,
    setAvailableSeats,
    setBookedSeats,
    isLoading
}: SeatsGridProps) {

    const handleSeatClick = (seatId: number) => {
        const seat = availableSeats.find(s => s.id === seatId) || 
                    selectedSeats.find(s => s.id === seatId);
        if (seat) {
            onSeatSelect(seat);
        }
    };
    const getSeatStatus = (seatId: number) => {
        const ticket = bookedSeats.find(ticket => ticket.seat_id === seatId);// наслідування 
        if (ticket) {
            return ticket.status === 'sold' ? 'booked' : 'available';
        }
        return 'available'; // Якщо квитка немає, вважаємо місце доступним
    };

    const renderSeat = (displayNumber: number, seat: ISeat) => {
        const status = getSeatStatus(seat.id);
        
        return (
            <button
                className={`seat ${status} ${selectedSeats.some(s => s.id === seat.id) ? 'selected' : ''}`}
                onClick={() => (status === 'available' || selectedSeats.some(s => s.id === seat.id)) && handleSeatClick(seat.id)}
                disabled={status === 'booked'}
                title={`Номер місця: ${displayNumber}`}
            >
                {displayNumber}
            </button>
        );
    };

    const getAllSeatsForSection = (seats: ISeat[], bookedSeats: ISeat[], rowStart: number, rowEnd: number, seatStart: number, seatEnd: number) => {
        if (!Array.isArray(seats) || !Array.isArray(bookedSeats)) {
            console.error("seats or bookedSeats is not an array");
            return [];
        }

        const allSeats = [...seats, ...bookedSeats];
        const uniqueSeats = allSeats.filter((seat, index, self) =>
            index === self.findIndex((s) => s.id === seat.id)
        );

        return uniqueSeats
            .filter(seat => 
                seat.row >= rowStart && 
                seat.row <= rowEnd && 
                seat.number >= seatStart &&
                seat.number <= seatEnd
            )
            .sort((a, b) => (a.row - b.row) || (a.number - b.number))
        ;
    };

    const leftSeats = getAllSeatsForSection(availableSeats, bookedSeats, 1, 5, 1, 5);
    const rightSeats = getAllSeatsForSection(availableSeats, bookedSeats, 1, 5, 6, 10);
    const centerSeats = getAllSeatsForSection(availableSeats, bookedSeats, 6, 10, 1, 10);

    if (leftSeats.length !== 25 || rightSeats.length !== 25 || centerSeats.length !== 50) {
        console.warn('Кількість місць не відповідає очікуваній: Ліва 25, Права 25, Центр 50');
    }

    useEffect(() => {
        if (!selectedShow) return;

        // Видалено код Laravel Echo

        // Якщо потрібна інша логіка при виборі показу, додайте її тут

    }, [selectedShow, setAvailableSeats, setBookedSeats]);

    return (
        <div className="seats-container">
            {onBack && (
                <button onClick={onBack} className="back-button">
                    ← Назад до вибору показів
                </button>
            )}
            <div className="stage"></div>
            
            <div className="seats-grid">
                {/* Перший ряд залу - горизонтальне розташування */}
                <div className="seats-row">
                    <div className="side-seats left">
                        {leftSeats.map((seat, index) => (
                            <React.Fragment key={seat.id}>
                                {renderSeat(index + 1, seat)}
                            </React.Fragment>
                        ))}
                    </div>

                    <div className="center-seats">
                        {centerSeats.map((seat, index) => (
                            <React.Fragment key={seat.id}>
                                {renderSeat(index + 51, seat)}
                            </React.Fragment>
                        ))}
                    </div>

                    <div className="side-seats right">
                        {rightSeats.map((seat, index) => (
                            <React.Fragment key={seat.id}>
                                {renderSeat(index + 26, seat)}
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            </div>

            <div className="legend">
                {[
                    { color: 'legend-available', text: 'Доступне' },
                    { color: 'legend-booked', text: 'Заброньоване' },
                    { color: 'legend-selected', text: 'Обрані' }
                ].map((item, index) => (
                    <div key={index} className="legend-item">
                        <div className={`legend-color ${item.color}`}></div>
                        <span>{item.text}</span>
                    </div>
                ))}
            </div>
            
            <div className="booking-summary">
                <p>Обрані місця: {selectedSeats.length}</p>
                <p>Загальна вартість: {price * selectedSeats.length} грн</p>
                <button 
                    className={`booking-button ${isLoading ? 'loading' : ''}`}
                    disabled={selectedSeats.length === 0 || isLoading}
                    onClick={handleBooking}
                >
                    <span>Забронювати</span>
                    {isLoading && <div className="button-spinner" />}
                </button>
            </div>
        </div>
    );
}