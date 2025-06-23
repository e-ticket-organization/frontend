'use client';

import React, { useState, useEffect } from 'react';
import { getUserTickets, getUserProfile, cancelTicketBooking, getPerfomances, getShows, downloadTicketPdf, downloadAllUserTicketsPdf, downloadTicketAsCsv, downloadAllUserTicketsAsCsv } from '@/app/services/filmService';
import { ITicket } from '@/app/types/ticket';
import { IUser } from '@/app/types/user';
import './tickets-profile.styles.css';
import { IShow } from '@/app/types/show';

export default function TicketsProfile() {
  const [tickets, setTickets] = useState<ITicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<IUser | null>(null);
  const [cancellingTicketId, setCancellingTicketId] = useState<number | null>(null);
  const [performance, setPerformance] = useState<IShow[]>([]);
  const [downloadingTicketId, setDownloadingTicketId] = useState<number | null>(null);
  const [downloadingAllTickets, setDownloadingAllTickets] = useState(false);
  const [pdfFeatureEnabled, setPdfFeatureEnabled] = useState(true); // Можна тимчасово вимкнути функціонал PDF

  useEffect(() => {
    fetchUserAndTickets();
    fetchPerformance();
  }, []);

  const validateTicketDates = (tickets: ITicket[]) => {
    const invalidTickets = [];
    
    for (const ticket of tickets) {
      const dateChecks = {
        ticket_id: ticket.id,
        ticket_number: ticket.ticket_number,
        issues: [] as string[]
      };
      
      try {
        // Перевіряємо дати квитка
        if (!ticket.created_at || ticket.created_at === null) {
          dateChecks.issues.push('created_at is null');
        }
        if (!ticket.updated_at || ticket.updated_at === null) {
          dateChecks.issues.push('updated_at is null');
        }
        
        // Перевіряємо дати показу
        if (!ticket.show) {
          dateChecks.issues.push('show is undefined');
        } else {
          if (!ticket.show.datetime || ticket.show.datetime === null) {
            dateChecks.issues.push('show.datetime is null');
          }
          if (!ticket.show.created_at || ticket.show.created_at === null) {
            dateChecks.issues.push('show.created_at is null');
          }
          
          // Перевіряємо дати вистави
          if (!ticket.show.performance) {
            dateChecks.issues.push('show.performance is undefined');
          } else if (!ticket.show.performance.created_at || ticket.show.performance.created_at === null) {
            dateChecks.issues.push('show.performance.created_at is null');
          }
        }
        
        if (dateChecks.issues.length > 0) {
          invalidTickets.push(dateChecks);
        }
      } catch (error: any) {
        console.error(`Помилка при валідації квитка ${ticket.id}:`, error);
        dateChecks.issues.push(`Validation error: ${error?.message || 'Unknown error'}`);
        invalidTickets.push(dateChecks);
      }
    }
    
    if (invalidTickets.length > 0) {
      console.warn('Знайдено квитки з некоректними датами:', invalidTickets);
      // Попереджаємо користувача, але залишаємо можливість спробувати PDF
      console.warn(`Виявлено ${invalidTickets.length} квиток(ів) з потенційними проблемами дат`);
      setPdfFeatureEnabled(true); // Залишаємо ввімкненим, але з попередженнями
    } else {
      console.log('Усі дати квитків валідні');
      setPdfFeatureEnabled(true);
    }
    
    return invalidTickets;
  };

  const fetchUserAndTickets = async () => {
    try {
      setIsLoading(true);
      const userData = await getUserProfile();
      setUser(userData);
      
      if (userData.id) {
        const ticketsData = await getUserTickets();
        
        if (ticketsData.length > 0) {
          console.log('Структура квитка:', JSON.stringify(ticketsData[0], null, 2));
          console.log('Структура seat:', ticketsData[0].seat);
          console.log('Властивості seat:', Object.keys(ticketsData[0].seat || {}));
          
          // Додаткова діагностика структури даних
          console.log('Діагностика структури квитків:');
          ticketsData.forEach((ticket, index) => {
            console.log(`Квиток ${index + 1}:`, {
              id: ticket.id,
              hasShow: !!ticket.show,
              hasPerformance: !!(ticket.show && ticket.show.performance),
              showKeys: ticket.show ? Object.keys(ticket.show) : 'show is undefined',
              performanceKeys: ticket.show?.performance ? Object.keys(ticket.show.performance) : 'performance is undefined'
            });
          });
          
          // Валідуємо дати в квитках
          validateTicketDates(ticketsData);
        }
        
        setTickets(ticketsData);
      }
    } catch (err: any) {
      setError('Помилка при завантаженні даних');
      console.error('Помилка завантаження:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPerformance = async () => {
    const result = await getShows(1, 1000);
    setPerformance(result?.shows || []);
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

  const handleDownloadTicket = async (ticketId: number) => {
    try {
      setDownloadingTicketId(ticketId);
      setError(null);
      
      console.log('Завантаження PDF для квитка:', ticketId);
      const ticket = tickets.find(t => t.id === ticketId);
      if (ticket) {
        console.log('Дані квитка для PDF:', {
          id: ticket.id,
          ticket_number: ticket.ticket_number,
          show_datetime: ticket.show.datetime,
          created_at: ticket.created_at,
          updated_at: ticket.updated_at
        });
      }
      
      try {
        // Спочатку намагаємося завантажити PDF через новий endpoint
        await downloadTicketPdf(ticketId);
        console.log('PDF успішно завантажено для квитка:', ticketId);
      } catch (pdfError: any) {
        console.warn('PDF завантаження не вдалося, пробуємо CSV:', pdfError.message);
        // Якщо PDF не працює, завантажуємо CSV альтернативу
        await downloadTicketAsCsv(ticketId);
        console.log('CSV звіт успішно завантажено для квитка:', ticketId);
        setError('PDF недоступний, завантажено CSV звіт');
        setTimeout(() => setError(null), 3000);
      }
    } catch (err: any) {
      console.error('Помилка завантаження квитка:', err);
      setError(err.message || 'Помилка при завантаженні квитка');
    } finally {
      setDownloadingTicketId(null);
    }
  };

  const handleDownloadAllTickets = async () => {
    try {
      setDownloadingAllTickets(true);
      setError(null);
      
      console.log('Завантаження PDF для всіх квитків користувача');
      console.log('Кількість квитків:', tickets.length);
      
      await downloadAllUserTicketsPdf();
      console.log('PDF усіх квитків успішно завантажено');
    } catch (err: any) {
      console.error('Помилка завантаження PDF усіх квитків:', err);
      setError(err.message || 'Помилка при завантаженні PDF усіх квитків');
    } finally {
      setDownloadingAllTickets(false);
    }
  };

  if (isLoading) {
    return <div className="loading">Завантаження квитків...</div>;
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error">{error}</div>
        {error.includes('дати') && (
          <div className="error-details">
            <p>Ця помилка може виникати через некоректні дані дат у базі даних.</p>
            <p>Спробуйте оновити сторінку або зверніться до підтримки.</p>
            <button 
              className="retry-button" 
              onClick={() => {
                setError(null);
                fetchUserAndTickets();
              }}
            >
              Спробувати знову
            </button>
          </div>
        )}
      </div>
    );
  }

  if (tickets.length === 0) {
    return <div className="empty">У вас поки немає куплених квитків</div>;
  }

  return (
    <div className="tickets-container">
      <div className="tickets-header">
        <h2 className="tickets-title">Мої квитки</h2>
        {tickets.length > 0 && pdfFeatureEnabled && (
          <button
            className="download-all-button"
            onClick={handleDownloadAllTickets}
            disabled={downloadingAllTickets}
            title="Завантажити всі квитки у форматі PDF"
          >
            {downloadingAllTickets ? 'Завантаження...' : 'Завантажити всі квитки PDF'}
          </button>
        )}
        {tickets.length > 0 && !pdfFeatureEnabled && (
          <div className="pdf-disabled-notice">
            Функція PDF тимчасово недоступна
          </div>
        )}
      </div>
      <div className="tickets-list">
        {tickets.map((ticket) => {
          const isActive = new Date(ticket.show.datetime) > new Date();
          
          return (
            <div key={ticket.id} className={`ticket-card ${isActive ? 'active' : 'past'}`}>
              <div className="ticket-header">
                <h3>
                  {performance.find(p => p.id === ticket.show.performance_id)?.performance?.title || 
                   `Вистава ID: ${ticket.show.performance_id}`}
                </h3>
                <span className={`status ${isActive ? 'status-active' : 'status-past'}`}>
                  {isActive ? 'Активний' : 'Минулий'}
                </span>
              </div>
              
              <div className="ticket-info">
                <div className="ticket-detail">
                    <span className="label">Дата та час:</span>
                    <span className="value">{formatDate(ticket.show.datetime)}</span>
                </div>
                
                <div className="ticket-detail">
                  <span className="label">Місце:</span>
                  <span className="value">
                    {(() => {
                      if (ticket.seat) {
                        const seatNumber = ticket.seat.number;
                        if (seatNumber) {
                          return `Ряд ${ticket.seat.row}, Місце ${seatNumber}`;
                        }
                        
                        console.log('Дані місця:', ticket.seat);
                      }
                      
                      const ticketParts = ticket.ticket_number.split('-');
                      if (ticketParts.length === 2) {
                        const seatInfo = ticketParts[1];
                        const row = seatInfo.match(/R(\d+)/)?.[1];
                        const seat = seatInfo.match(/S(\d+)/)?.[1];
                        
                        if (row && seat) {
                          return `Ряд ${row}, Місце ${seat}`;
                        }
                      }
                      
                      return 'Інформація про місце недоступна';
                    })()}
                  </span>
                </div>
                
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

              <div className="ticket-actions">
                {pdfFeatureEnabled ? (
                  <button
                    className="download-ticket-button"
                    onClick={() => handleDownloadTicket(ticket.id)}
                    disabled={downloadingTicketId === ticket.id}
                    title="Завантажити квиток у форматі PDF"
                  >
                    {downloadingTicketId === ticket.id ? 'Завантаження...' : '📄 Завантажити PDF'}
                  </button>
                ) : (
                  <button
                    className="download-ticket-button disabled"
                    disabled={true}
                    title="Функція PDF тимчасово недоступна через технічні роботи"
                  >
                    📄 PDF недоступний
                  </button>
                )}
                {isActive && (
                  <button
                    className="cancel-button"
                    onClick={() => handleCancelBooking(ticket.id)}
                    disabled={cancellingTicketId === ticket.id}
                  >
                    {cancellingTicketId === ticket.id ? 'Відміна...' : 'Відмінити бронювання'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}