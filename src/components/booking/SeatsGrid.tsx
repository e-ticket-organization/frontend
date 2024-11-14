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
        if (bookedSeats.some(seat => seat.id === seatId)) {
            return 'booked';
        } else if (selectedSeats.some(seat => seat.id === seatId)) {
            return 'selected';
        } else if (availableSeats.some(seat => seat.id === seatId)) {
            return 'available';
        } else {
            return 'unavailable';
        }
    };

    const renderSeat = (displayNumber: number, seat: ISeat) => {
        const status = getSeatStatus(seat.id);
        
        return (
            <button
                className={`seat ${status}`}
                onClick={() => (status === 'available' || status === 'selected') && handleSeatClick(seat.id)}
                disabled={status === 'booked'}
                key={seat.id}
                title={`Номер місця: ${displayNumber}`}
            >
                {displayNumber}
            </button>
        );
    };

    const getAllSeatsForSection = (seats: ISeat[], bookedSeats: ISeat[], rowStart: number, rowEnd: number, seatStart: number, seatEnd: number) => {
        const allSeats = [...seats, ...bookedSeats];
        return allSeats
            .filter(seat => 
                seat.row >= rowStart && 
                seat.row <= rowEnd && 
                seat.seat_number >= seatStart && 
                seat.seat_number <= seatEnd
            )
            .sort((a, b) => (a.row - b.row) || (a.seat_number - b.seat_number));
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
            <div className="seats-grid">
                <div className="side-seats left">
                    {leftSeats.map((seat, index) => (
                        renderSeat(index + 1, seat) 
                    ))}
                </div>

                <div className="center-seats">
                    {centerSeats.map((seat, index) => (
                        renderSeat(index + 51, seat) 
                    ))}
                </div>

                <div className="side-seats right">
                    {rightSeats.map((seat, index) => (
                        renderSeat(index + 26, seat) 
                    ))}
                </div>
            </div>

            <div className="legend">
                <div className="legend-item">
                    <div className="legend-color legend-available"></div>
                    <span>Доступне</span>
                </div>
                <div className="legend-item">
                    <div className="legend-color legend-booked"></div>
                    <span>Заброньоване</span>
                </div>
                <div className="legend-item">
                    <div className="legend-color legend-selected"></div>
                    <span>Обрані</span>
                </div>
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