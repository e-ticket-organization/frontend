'use client'
import React, { useState, useEffect } from 'react';
import './panel.styles.css';
import { useRouter } from 'next/navigation';
import { getPerfomances, getProducers, getUsers, getShows, getActors, getPerfomanceById, getShowById } from '@/app/services/filmService';
import { IPerfomance } from '@/app/types/perfomance';
import { IProducer } from '@/app/types/producer';
import { IUser } from '@/app/types/user';
import { IShow } from '@/app/types/show';
import { IActor } from '@/app/types/actor';
import { getToken } from '@/app/services/authService';
import EditPerformance from '@/components/admin/edit/EditPerformance';
import EditActor from '@/components/admin/edit/EditActor';
import EditProducer from '@/components/admin/edit/EditProducer';
import EditShow from '@/components/admin/edit/EditShow';
import EditUser from '@/components/admin/edit/EditUser';
import Analytics from '@/components/admin/analytics/Analytics';

export default function Panel() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('Events');
  const [performances, setPerformances] = useState<IPerfomance[]>([]);
  const [producers, setProducers] = useState<IProducer[]>([]);
  const [actors, setActors] = useState<IActor[]>([]);
  const [users, setUsers] = useState<IUser[]>([]);
  const [shows, setShows] = useState<IShow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const token = getToken;
  const [selectedPerformance, setSelectedPerformance] = useState<IPerfomance | null>(null);
  const [selectedActor, setSelectedActor] = useState<(IActor & { id: number }) | null>(null);
  const [selectedProducer, setSelectedProducer] = useState<(IProducer & { id: number }) | null>(null);
  const [selectedShow, setSelectedShow] = useState<IShow | null>(null);
  const [selectedUser, setSelectedUser] = useState<IUser | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        console.log('Запит до API для отримання акторів');
        if (activeTab === 'Actors') {
          const actorsData = await getActors();
          console.log('Отримані актори:', actorsData);
          setActors(actorsData);
        } else if (activeTab === 'Events') {
          const performancesData = await getPerfomances();
          setPerformances(performancesData);
        } else if (activeTab === 'Producers') {
          const producersData = await getProducers();
          setProducers(producersData);
          console.log('Отримані продюсери:', producersData);
        } else if (activeTab === 'Users') {
          const usersData = await getUsers();
          setUsers(usersData);
        } else if (activeTab === 'Shows') {
          const showsData = await getShows();
          setShows(showsData);
        }
      } catch (error) {
        console.error('Помилка завантаження даних:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (activeTab !== 'Analytics') {
      fetchData();
    }
  }, [activeTab]);

  const handleEditPerformance = async (performance: IPerfomance) => {
    try {
      const fullPerformance = await getPerfomanceById(performance.id);
      setSelectedPerformance(fullPerformance);
    } catch (error) {
      console.error('Помилка отримання повних даних вистави:', error);
    }
  };

  const handleEditActor = (actor: IActor) => {
    if (!actor.id) {
      console.error('Актор не має ID');
      return;
    }
    setSelectedActor(actor as IActor & { id: number });
  };

  const handleUpdatePerformance = (updatedPerformance: IPerfomance) => {
    setPerformances(prevPerformances => 
      prevPerformances.map(p => 
        p.id === updatedPerformance.id ? updatedPerformance : p
      )
    );
    setSelectedPerformance(null);
  };

  const handleUpdateActor = (updatedActor: IActor) => {
    if (!updatedActor.id) {
        console.error('Оновлений актор не має ID');
        return;
    }
    setActors(prevActors => 
        prevActors.map(a => 
            a.id === updatedActor.id ? updatedActor : a
        )
    );
    setSelectedActor(null);
  };

  const handleEditProducer = (producer: IProducer) => {
    if (!producer || !producer.id) {
        console.error('Продюсер не має ID');
        return;
    }
    setSelectedProducer(producer as IProducer & { id: number });
  };

  const handleUpdateProducer = (updatedProducer: IProducer & { id: number }) => {
    setProducers(prevProducers => 
        prevProducers.map(producer => 
            producer.id === updatedProducer.id ? updatedProducer : producer
        )
    );
    setSelectedProducer(null);
  };

  const handleEditShow = async (show: IShow) => {
    try {
      const fullShow = await getShowById(show.id);
      setSelectedShow(fullShow);
    } catch (error) {
      console.error('Помилка отримання повних даних показу:', error);
    }
  };

  const handleUpdateShow = (updatedShow: IShow) => {
    setShows(prevShows => 
      prevShows.map(show => {
        if (show.id === updatedShow.id) {
          return {
            ...updatedShow,
            performance: updatedShow.performance || show.performance,
            hall: updatedShow.hall || show.hall
          };
        }
        return show;
      })
    );
    setSelectedShow(null);
  };

  const handleEditUser = (user: IUser) => {
    if (!user.id) {
      console.error('Користувач не має ID');
      return;
    }
    setSelectedUser(user);
  };

  const handleUpdateUser = (updatedUser: IUser) => {
    setUsers(prevUsers => 
      prevUsers.map(user => 
        user.id === updatedUser.id ? updatedUser : user
      )
    );
    setSelectedUser(null);
  };

  const handleDeleteActor = (actorId: number) => {
    setActors(prevActors => prevActors.filter(actor => actor.id !== actorId));
  };

  const handleDeleteUser = (userId: number) => {
    setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
  };

  const handleDeleteShow = (showId: number) => {
    setShows(prevShows => prevShows.filter(show => show.id !== showId));
  };

  const handleDeletePerformance = (performanceId: number) => {
    setPerformances(prevPerformances => 
        prevPerformances.filter(performance => performance.id !== performanceId)
    );
  };

  const renderLoader = () => (
    <div className="loader-container">
      <div className="loader"></div>
    </div>
  );

  return (
    <aside className='elements-container'>
      <div className='buttons-container'>
        <button 
          className={activeTab === 'Analytics' ? 'active' : ''} 
          onClick={() => setActiveTab('Analytics')}
        >
          Analytics
        </button>
        <button 
          className={activeTab === 'Events' ? 'active' : ''} 
          onClick={() => setActiveTab('Events')}
        >
          Performances
        </button>
        <button 
          className={activeTab === 'Shows' ? 'active' : ''} 
          onClick={() => setActiveTab('Shows')}
        >
          Shows
        </button>
        <button 
          className={activeTab === 'Actors' ? 'active' : ''} 
          onClick={() => setActiveTab('Actors')}
        >
          Actors
        </button>
        <button 
          className={activeTab === 'Producers' ? 'active' : ''} 
          onClick={() => setActiveTab('Producers')}
        >
          Producers
        </button>
        <button 
          className={activeTab === 'Users' ? 'active' : ''} 
          onClick={() => setActiveTab('Users')}
        >
          Users
        </button>
      </div>

      {/* Analytics Tab */}
      {activeTab === 'Analytics' && (
        <div className="analytics-tab">
          <Analytics />
        </div>
      )}

      {/* Performances Tab */}
      {activeTab === 'Events' && (
        <div className="elements-list">
          {isLoading ? (
            <div className="loader-container">
              <div className="loader"></div>
            </div>
          ) : (
            <>
              <div className="table-container">
                <h2 className="table-header">Список вистав</h2>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th className="id-column">ID</th>
                      <th className="image-column">Фото</th>
                      <th className="name-column">Назва</th>
                      <th className="duration-column">Тривалість</th>
                      <th className="actions-column">Дії</th>
                    </tr>
                  </thead>
                  <tbody>
                    {performances.length > 0 ? (
                      performances.map((performance) => (
                        <tr key={performance.id}>
                          <td className="id-column">{performance.id}</td>
                                                     <td className="image-column">
                             {performance.image ? (
                               <img 
                                 src={performance.image} 
                                 alt={performance.title}
                               />
                             ) : (
                               <div className="image-placeholder">
                                 <svg viewBox="0 0 24 24" width="24" height="24" fill="#b0c4de">
                                   <path d="M21,19V5c0,-1.1 -0.9,-2 -2,-2H5c-1.1,0 -2,0.9 -2,2v14c0,1.1 0.9,2 2,2h14c1.1,0 2,-0.9 2,-2zM8.5,13.5l2.5,3.01L14.5,12l4.5,6H5l3.5,-4.5z"/>
                                 </svg>
                               </div>
                             )}
                           </td>
                          <td className="name-column" title={performance.title}>
                            {performance.title}
                          </td>
                          <td className="duration-column">
                            {performance.duration} хв
                          </td>
                          <td className="actions-column">
                            <button
                              className="edit-btn"
                              onClick={() => {
                                setSelectedPerformance(performance);
                              }}
                              title="Редагувати виставу"
                            >
                              <svg viewBox="0 0 24 24">
                                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                              </svg>
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="empty-state">
                          Немає вистав для відображення
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* Shows Tab */}
      {activeTab === 'Shows' && (
        <div className="elements-list">
          {isLoading ? (
            <div className="loader-container">
              <div className="loader"></div>
            </div>
          ) : (
            <>
              <div className="table-container">
                <h2 className="table-header">Список показів</h2>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th className="id-column">ID</th>
                      <th className="name-column">Вистава</th>
                      <th className="date-column">Дата і час</th>
                      <th className="price-column">Ціна</th>
                      <th className="hall-column">Зал</th>
                      <th className="actions-column">Дії</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shows.length > 0 ? (
                      shows.map((show) => (
                        <tr key={show.id}>
                          <td className="id-column">{show.id}</td>
                          <td className="name-column" title={show.performance?.title || 'Невідома вистава'}>
                            {show.performance?.title || 'Невідома вистава'}
                          </td>
                          <td className="date-column">
                            {new Date(show.datetime).toLocaleString('uk-UA', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </td>
                          <td className="price-column">{show.price} грн</td>
                                                      <td className="hall-column">
                              Зал {show.hall?.hall_number || 'Не вказано'}
                            </td>
                          <td className="actions-column">
                            <button
                              className="edit-btn"
                              onClick={() => {
                                setSelectedShow(show);
                              }}
                              title="Редагувати показ"
                            >
                              <svg viewBox="0 0 24 24">
                                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                              </svg>
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="empty-state">
                          Немає показів для відображення
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* Actors Tab */}
      {activeTab === 'Actors' && (
        <div className="elements-list">
          {isLoading ? (
            <div className="loader-container">
              <div className="loader"></div>
            </div>
          ) : (
            <>
              <div className="table-container">
                <h2 className="table-header">Список акторів</h2>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th className="id-column">ID</th>
                      <th className="image-column">Фото</th>
                      <th className="name-column">Ім'я</th>
                      <th className="actions-column">Дії</th>
                    </tr>
                  </thead>
                  <tbody>
                    {actors.length > 0 ? (
                      actors.map((actor) => (
                        <tr key={actor.id}>
                          <td className="id-column">{actor.id}</td>
                                                     <td className="image-column">
                             <div className="image-placeholder">
                               <svg viewBox="0 0 24 24" width="24" height="24" fill="#b0c4de">
                                 <path d="M12,12c2.21,0 4,-1.79 4,-4s-1.79,-4 -4,-4 -4,1.79 -4,4 1.79,4 4,4zM12,14c-2.67,0 -8,1.34 -8,4v2h16v-2c0,-2.66 -5.33,-4 -8,-4z"/>
                               </svg>
                             </div>
                           </td>
                           <td className="name-column" title={actor.full_name}>
                             {actor.full_name}
                           </td>
                          <td className="actions-column">
                            <button
                              className="edit-btn"
                              onClick={() => {
                                setSelectedActor(actor);
                              }}
                              title="Редагувати актора"
                            >
                              <svg viewBox="0 0 24 24">
                                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                              </svg>
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="empty-state">
                          Немає акторів для відображення
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* Producers Tab */}
      {activeTab === 'Producers' && (
        <div className="elements-list">
          {isLoading ? (
            <div className="loader-container">
              <div className="loader"></div>
            </div>
          ) : (
            <>
              <div className="table-container">
                <h2 className="table-header">Список продюсерів</h2>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th className="id-column">ID</th>
                      <th className="image-column">Фото</th>
                      <th className="name-column">Ім'я</th>
                      <th className="actions-column">Дії</th>
                    </tr>
                  </thead>
                  <tbody>
                    {producers.length > 0 ? (
                      producers.map((producer) => (
                        <tr key={producer.id}>
                          <td className="id-column">{producer.id}</td>
                                                     <td className="image-column">
                             <div className="image-placeholder">
                               <svg viewBox="0 0 24 24" width="24" height="24" fill="#b0c4de">
                                 <path d="M12,12c2.21,0 4,-1.79 4,-4s-1.79,-4 -4,-4 -4,1.79 -4,4 1.79,4 4,4zM12,14c-2.67,0 -8,1.34 -8,4v2h16v-2c0,-2.66 -5.33,-4 -8,-4z"/>
                               </svg>
                             </div>
                           </td>
                           <td className="name-column" title={`${producer.first_name} ${producer.last_name}`}>
                             {`${producer.first_name} ${producer.last_name}`}
                           </td>
                          <td className="actions-column">
                            <button
                              className="edit-btn"
                              onClick={() => {
                                setSelectedProducer(producer);
                              }}
                              title="Редагувати продюсера"
                            >
                              <svg viewBox="0 0 24 24">
                                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                              </svg>
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="empty-state">
                          Немає продюсерів для відображення
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'Users' && (
        <div className="elements-list">
          {isLoading ? (
            <div className="loader-container">
              <div className="loader"></div>
            </div>
          ) : (
            <>
              <div className="table-container">
                <h2 className="table-header">Список користувачів</h2>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th className="id-column">ID</th>
                      <th className="name-column">Ім'я</th>
                      <th className="email-column">Email</th>
                      <th className="phone-column">Телефон</th>
                      <th className="passport-column">Паспорт</th>
                      <th className="actions-column">Дії</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length > 0 ? (
                      users.map((user) => (
                        <tr key={user.id}>
                          <td className="id-column">{user.id}</td>
                          <td className="name-column" title={user.name}>
                            {user.name}
                          </td>
                          <td className="email-column" title={user.email}>
                            {user.email}
                          </td>
                                                     <td className="phone-column" title={user.phoneNumbers || undefined}>
                             {user.phoneNumbers || <span className="placeholder-text">Не вказано</span>}
                           </td>
                           <td className="passport-column" title="Паспорт">
                             <span className="placeholder-text">Не вказано</span>
                           </td>
                          <td className="actions-column">
                            <button
                              className="edit-btn"
                              onClick={() => {
                                setSelectedUser(user);
                              }}
                              title="Редагувати користувача"
                            >
                              <svg viewBox="0 0 24 24">
                                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                              </svg>
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="empty-state">
                          Немає користувачів для відображення
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* Модальні вікна для редагування */}
      {selectedPerformance && (
        <EditPerformance
          performance={selectedPerformance}
          onClose={() => setSelectedPerformance(null)}
          onUpdate={handleUpdatePerformance}
          onDelete={handleDeletePerformance}
        />
      )}
      {selectedActor && (
        <EditActor
          actor={selectedActor}
          onClose={() => setSelectedActor(null)}
          onUpdate={handleUpdateActor}
          onDelete={handleDeleteActor}
        />
      )}
      {selectedProducer && (
        <EditProducer
          producer={selectedProducer}
          onClose={() => setSelectedProducer(null)}
          onUpdate={handleUpdateProducer}
        />
      )}
      {selectedShow && (
        <EditShow
          show={selectedShow}
          onClose={() => setSelectedShow(null)}
          onUpdate={handleUpdateShow}
          onDelete={handleDeleteShow}
        />
      )}
      {selectedUser && (
        <EditUser
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onUpdate={handleUpdateUser}
          onDelete={handleDeleteUser}
        />
      )}
    </aside>
  )
}