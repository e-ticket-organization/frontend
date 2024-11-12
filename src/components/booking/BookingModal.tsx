import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import SeatsGrid from './SeatsGrid';
import ShowDateSelector from './ShowDateSelector';
import Spinner from '../ui/Spinner';
import { ISeat } from '@/app/types/seat';
import { IShow } from '@/app/types/show';
import { bookTickets, getShowSeats, getShowsByPerformance } from '@/app/services/filmService';
import { IPerfomance } from '@/app/types/perfomance';

interface BookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedPerformance: IPerfomance | null;
}

export default function BookingModal({ 
    isOpen, 
    onClose, 
    selectedPerformance 
}: BookingModalProps) {
    const [shows, setShows] = useState<IShow[]>([]);
    const [selectedShow, setSelectedShow] = useState<IShow | null>(null);
    const [selectedSeats, setSelectedSeats] = useState<ISeat[]>([]);
    const [availableSeats, setAvailableSeats] = useState<ISeat[]>([]);
    const [bookedSeats, setBookedSeats] = useState<ISeat[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [step, setStep] = useState<'dates' | 'seats'>('dates');

    useEffect(() => {
        const fetchShows = async () => {
            if (!selectedPerformance?.id) return;
            
            try {
                setIsLoading(true);
                const showsData = await getShowsByPerformance(selectedPerformance.id);
                console.log('Завантажені покази:', showsData);
                setShows(showsData);
                setStep('dates');
            } catch (err: any) {
                setError(err.message || 'Помилка при завантаженні показів');
            } finally {
                setIsLoading(false);
            }
        };

        if (isOpen && selectedPerformance) {
            fetchShows();
        } else {
            setShows([]);
            setSelectedShow(null);
            setSelectedSeats([]);
            setAvailableSeats([]);
            setBookedSeats([]);
            setError(null);
            setStep('dates');
        }
    }, [isOpen, selectedPerformance]);

    const handleShowSelect = async (show: IShow) => {
        try {
            setIsLoading(true);
            setError(null);
            setSelectedShow(show);
            
            const seatsData = await getShowSeats(show.id);
            
            setAvailableSeats(seatsData.available_seats);
            setBookedSeats(seatsData.booked_seats);
            setStep('seats');
        } catch (err: any) {
            setError(err.message || 'Помилка при виборі показу');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSeatSelect = (seat: ISeat) => {
        if (selectedSeats.find(s => s.id === seat.id)) {
            setSelectedSeats(selectedSeats.filter(s => s.id !== seat.id));
        } else {
            setSelectedSeats([...selectedSeats, seat]);
        }
    };

    const handleBooking = async () => {
        if (!selectedShow || selectedSeats.length === 0) {
            setError('Виберіть місця для бронювання');
            return;
        }

        try {
            setIsLoading(true);
            
            const bookingData = {
                tickets: selectedSeats.map(seat => ({
                    show_id: selectedShow.id,
                    seat_id: seat.id
                })),
                silent: true
            };

            await bookTickets(bookingData);
            
            setBookedSeats(prev => [...prev, ...selectedSeats]);
            setAvailableSeats(prev => 
                prev.filter(seat => !selectedSeats.some(selected => selected.id === seat.id))
            );
            setSelectedSeats([]);
            console.log('Бронювання успішне');
        } catch (error: any) {
            console.error('Помилка бронювання:', error);
            setError(error.message || 'Помилка при бронюванні квитків');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCloseModal = () => {
        setStep('dates');
        setSelectedShow(null);
        setSelectedSeats([]);
        setAvailableSeats([]);
        setBookedSeats([]);
        setError(null);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleCloseModal}>
            {error ? (
                <div className="error">
                    <p>{error}</p>
                    <button onClick={() => setError(null)}>Спробувати знову</button>
                </div>
            ) : (
                step === 'dates' ? (
                    <ShowDateSelector
                        shows={shows}
                        onShowSelect={handleShowSelect}
                        selectedPerformance={selectedPerformance}
                        isLoading={isLoading}
                    />
                ) : (
                    <SeatsGrid
                        availableSeats={availableSeats}
                        bookedSeats={bookedSeats}
                        selectedSeats={selectedSeats}
                        onSeatSelect={handleSeatSelect}
                        price={Number(selectedShow?.price) || 0}
                        selectedShow={selectedShow}
                        handleBooking={handleBooking}
                        onClose={handleCloseModal}
                        setAvailableSeats={setAvailableSeats}
                        setBookedSeats={setBookedSeats}
                        isLoading={isLoading}
                    />
                )
            )}
        </Modal>
    );
};