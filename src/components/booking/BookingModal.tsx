import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import SeatsGrid from './SeatsGrid';
import ShowDateSelector from './ShowDateSelector';
import CityTheaterSelector from './CityTheaterSelector';
import Spinner from '../ui/Spinner';
import { ISeat } from '@/app/types/seat';
import { IShow } from '@/app/types/show';
import { bookTickets, getShowSeats, getShows, getShowsByFilters } from '@/app/services/filmService';
import { IPerfomance } from '@/app/types/perfomance';
import { StripePaymentForm } from '../payment/stripePaymentForm';
import '../payment/stripePaymentForm.styles.css';
import './booking-modal.styles.css';

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
    const [selectedCityId, setSelectedCityId] = useState<number | null>(null);
    const [selectedTheaterId, setSelectedTheaterId] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [step, setStep] = useState<'city-theater' | 'dates' | 'seats' | 'payment'>('city-theater');
    const [totalAmount, setTotalAmount] = useState(0);
    const [paymentSuccess, setPaymentSuccess] = useState(false);

    useEffect(() => {
        if (isOpen && selectedPerformance) {
            // Скидаємо всі стани при відкритті модалки
            setStep('city-theater');
            setShows([]);
            setSelectedShow(null);
            setSelectedSeats([]);
            setAvailableSeats([]);
            setBookedSeats([]);
            setSelectedCityId(null);
            setSelectedTheaterId(null);
            setError(null);
            setPaymentSuccess(false);
        } else {
            // Скидаємо стани при закритті
            setShows([]);
            setSelectedShow(null);
            setSelectedSeats([]);
            setAvailableSeats([]);
            setBookedSeats([]);
            setSelectedCityId(null);
            setSelectedTheaterId(null);
            setError(null);
            setStep('city-theater');
            setPaymentSuccess(false);
        }
    }, [isOpen, selectedPerformance]);

    const handleCityTheaterSelect = async (cityId: number, theaterId: number) => {
        try {
            setIsLoading(true);
            setError(null);
            setSelectedCityId(cityId);
            setSelectedTheaterId(theaterId);

            // Завантажуємо покази для вибраної вистави, міста та театру
            const filteredShows = await getShowsByFilters({
                performanceId: selectedPerformance?.id,
                cityId: cityId,
                theaterId: theaterId
            });

            // Фільтруємо тільки майбутні покази
            const futureShows = filteredShows.filter(show => 
                new Date(show.datetime) > new Date()
            );

            console.log('Завантажені покази для міста та театру:', futureShows);
            setShows(futureShows);
            setStep('dates');
        } catch (err: any) {
            setError(err.message || 'Помилка при завантаженні показів');
        } finally {
            setIsLoading(false);
        }
    };

    const handleShowSelect = async (show: IShow) => {
        try {
            setIsLoading(true);
            setError(null);
            setSelectedShow(show);
            
            const seatsData = await getShowSeats(show.id);
            console.log('Отримані дані місць:', seatsData);

            const rawData = seatsData as unknown as Record<string, any>;
            
            if (rawData && typeof rawData === 'object' && 'seats' in rawData && Array.isArray(rawData.seats)) {
                console.log('Обробка даних з поля seats');
                const seatArray = rawData.seats as Array<Record<string, any>>;
                
                const transformedSeats = seatArray.map(seat => ({
                    id: seat.id,
                    seat_id: seat.id,
                    row: seat.row,
                    number: seat.number,
                    status: seat.is_booked ? 'sold' : 'available',
                    is_booked: seat.is_booked,
                    created_at: seat.created_at || '',
                    updated_at: seat.updated_at || ''
                }));
                
                console.log('Всі місця після трансформації:', transformedSeats);
                
                const availableSeats = transformedSeats.filter(seat => !seat.is_booked);
                const bookedSeats = transformedSeats.filter(seat => seat.is_booked);
                
                console.log('Доступні місця після фільтрації:', availableSeats.length);
                console.log('Заброньовані місця після фільтрації:', bookedSeats.length);
                
                setAvailableSeats(availableSeats);
                setBookedSeats(bookedSeats);
            } else if (seatsData.available_seats && seatsData.booked_seats) {
                console.log('Обробка розділених даних з available_seats і booked_seats');
                console.log('Доступні місця:', seatsData.available_seats);
                console.log('Заброньовані місця:', seatsData.booked_seats);
                
                const available = seatsData.available_seats.map(seat => ({
                    ...seat,
                    seat_id: seat.id,
                    status: 'available',
                    is_booked: false
                }));
                
                const booked = seatsData.booked_seats.map(seat => ({
                    ...seat,
                    seat_id: seat.id,
                    status: 'sold',
                    is_booked: true
                }));
                
                setAvailableSeats(available);
                setBookedSeats(booked);
            } else {
                console.error('Неочікуваний формат даних:', seatsData);
                throw new Error('Неправильний формат даних місць');
            }
            
            setStep('seats');
        } catch (err: any) {
            console.error('Помилка при обробці місць:', err);
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

    const handleProceedToPayment = () => {
        if (!selectedShow || selectedSeats.length === 0) {
            setError('Виберіть місця для бронювання');
            return;
        }

        const amount = selectedSeats.length * Number(selectedShow.price || 0);
        setTotalAmount(amount);
        setStep('payment');
    };

    const handleCancelPayment = () => {
        setStep('seats');
    };

    const handleBooking = async (paymentIntentId?: string) => {
        if (!selectedShow || selectedSeats.length === 0) {
            setError('Виберіть місця для бронювання');
            return;
        }

        try {
            setIsLoading(true);
            
            console.log('Бронювання завершено успішно з payment intent:', paymentIntentId);
            
            const bookedWithStatus = selectedSeats.map(seat => ({
                ...seat,
                seat_id: seat.id,
                status: 'sold',
                is_booked: true
            }));
            
            setBookedSeats(prev => [...prev, ...bookedWithStatus]);
            setAvailableSeats(prev => 
                prev.filter(seat => !selectedSeats.some(selected => selected.id === seat.id))
            );
            setSelectedSeats([]);
            setPaymentSuccess(true);
            
            setTimeout(() => {
                setStep('seats');
                setPaymentSuccess(false);
            }, 3000);
            
        } catch (error: any) {
            console.error('Помилка обробки бронювання:', error);
            setError(error.message || 'Помилка при обробці бронювання');
        } finally {
            setIsLoading(false);
        }
    };

    const handleBackToCityTheater = () => {
        setStep('city-theater');
        setShows([]);
        setSelectedShow(null);
        setSelectedSeats([]);
        setAvailableSeats([]);
        setBookedSeats([]);
        setError(null);
    };

    const handleBackToDates = () => {
        setStep('dates');
        setSelectedShow(null);
        setSelectedSeats([]);
        setAvailableSeats([]);
        setBookedSeats([]);
        setError(null);
    };

    const handleCloseModal = () => {
        setStep('city-theater');
        setShows([]);
        setSelectedShow(null);
        setSelectedSeats([]);
        setAvailableSeats([]);
        setBookedSeats([]);
        setSelectedCityId(null);
        setSelectedTheaterId(null);
        setError(null);
        setPaymentSuccess(false);
        onClose();
    };

    const renderModalContent = () => {
        if (isLoading && (step === 'city-theater' || step === 'dates')) {
            return (
                <div className="loader-container">
                    <Spinner />
                    <p>{step === 'city-theater' ? 'Завантаження...' : 'Завантаження показів...'}</p>
                </div>
            );
        }

        if (error) {
            return (
                <div className="error-container">
                    <h3>Помилка</h3>
                    <p>{error}</p>
                    <button onClick={handleCloseModal} className="close-button">
                        Закрити
                    </button>
                </div>
            );
        }

        if (paymentSuccess) {
            return (
                <div className="success-container">
                    <h3>Бронювання успішне!</h3>
                    <p>Ваші квитки заброньовано. Перевірте електронну пошту для отримання деталей.</p>
                </div>
            );
        }

        switch (step) {
            case 'city-theater':
                return (
                    <CityTheaterSelector
                        selectedPerformance={selectedPerformance}
                        onSelectionComplete={handleCityTheaterSelect}
                        isLoading={isLoading}
                    />
                );
            case 'dates':
                return (
                    <ShowDateSelector
                        shows={shows}
                        onShowSelect={handleShowSelect}
                        selectedPerformance={selectedPerformance}
                        isLoading={isLoading}
                        onBack={handleBackToCityTheater}
                    />
                );
            case 'seats':
                return (
                    <SeatsGrid
                        availableSeats={availableSeats}
                        bookedSeats={bookedSeats}
                        selectedSeats={selectedSeats}
                        onSeatSelect={handleSeatSelect}
                        price={Number(selectedShow?.price) || 0}
                        selectedShow={selectedShow}
                        handleBooking={handleProceedToPayment}
                        onClose={handleCloseModal}
                        onBack={handleBackToDates}
                        setAvailableSeats={setAvailableSeats}
                        setBookedSeats={setBookedSeats}
                        isLoading={isLoading}
                    />
                );
            case 'payment':
                return (
                    <StripePaymentForm
                        amount={totalAmount}
                        onSuccess={handleBooking}
                        onCancel={handleCancelPayment}
                        bookingData={{
                            tickets: selectedSeats.map(seat => ({
                                show_id: Number(selectedShow?.id),
                                seat_id: Number(seat.id)
                            })),
                            paymentData: {
                                currency: "uah",
                                metadata: {
                                    source: "web-app"
                                },
                                description: "Оплата квитків на виставу"
                            }
                        }}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={handleCloseModal}>
            {renderModalContent()}
        </Modal>
    );
} 