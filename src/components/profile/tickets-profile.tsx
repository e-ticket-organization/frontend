'use client';

import React, { useState, useEffect } from 'react';
import { getUserTickets, getUserProfile, cancelTicketBooking } from '@/app/services/filmService';
import { ITicket } from '@/app/types/ticket';
import { IUser } from '@/app/types/user';
import './tickets-profile.styles.css';

export default function TicketsProfile() {
  const [tickets, setTickets] = useState<ITicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<IUser | null>(null);
  const [cancellingTicketId, setCancellingTicketId] = useState<number | null>(null);

  useEffect(() => {
    fetchUserAndTickets();
  }, []);

  const fetchUserAndTickets = async () => {
    try {
      setIsLoading(true);
      const userData = await getUserProfile();
      setUser(userData);
      
      if (userData.id) {
        const ticketsData = await getUserTickets();
        console.log('Структура квитка:', JSON.stringify(ticketsData[0], null, 2));
        setTickets(ticketsData);
      }
    } catch (err: any) {
      setError('Помилка при завантаженні даних');
      console.error('Помилка завантаження:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelBooking = async (ticketId: number) => {
    try {
      setCancellingTicketId(ticketId);
      await cancelTicketBooking(ticketId);
      await fetchUserAndTickets();
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCancellingTicketId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('uk-UA', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return <div className="loading">Завантаження квитків...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (tickets.length === 0) {
    return <div className="empty">У вас поки немає куплених квитків</div>;
  }

  return (
    <div className="tickets-container">
      <h2 className="tickets-title">Мої квитки</h2>
      <div className="tickets-list">
        {tickets.map((ticket) => {
          const isActive = new Date(ticket.show.datetime) > new Date();
          
          return (
            <div key={ticket.id} className={`ticket-card ${isActive ? 'active' : 'past'}`}>
              <div className="ticket-header">
                <h3>{ticket.show.performance.title}</h3>
                <span className={`status ${isActive ? 'status-active' : 'status-past'}`}>
                  {isActive ? 'Активний' : 'Минулий'}
                </span>
              </div>
              
              <div className="ticket-info">
                <div className="ticket-detail">
                    <span className="label">Дата та час:</span>
                    <span className="value">{formatDate(ticket.show.datetime)}</span>
                </div>
                
                {ticket.seat && (
                    <div className="ticket-detail">
                    <span className="label">Місце:</span>
                    <span className="value">
                        Ряд {ticket.seat.row}, Місце {Number(ticket.seat.seat_number)}
                    </span>
                    </div>
                )}
                
                {ticket.show.hall && (
                  <div className="ticket-detail">
                    <span className="label">Зал:</span>
                    <span className="value">№{Number(ticket.show.hall.hall_number)}</span>
                  </div>
                )}
                
                <div className="ticket-detail">
                  <span className="label">Ціна:</span>
                  <span className="value">{Number(ticket.price).toFixed(2)} грн</span>
                </div>
              </div>

              {isActive && (
                <div className="ticket-actions">
                  <button
                    className="cancel-button"
                    onClick={() => handleCancelBooking(ticket.id)}
                    disabled={cancellingTicketId === ticket.id}
                  >
                    {cancellingTicketId === ticket.id ? 'Відміна...' : 'Відмінити бронювання'}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}