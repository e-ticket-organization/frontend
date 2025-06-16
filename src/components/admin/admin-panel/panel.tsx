'use client'
import React, { useState, useEffect, useContext } from 'react';
import './panel.styles.css';
import { useRouter } from 'next/navigation';
import { getPerfomances, getProducers, getUsers, getShows, getActors, getPerfomanceById, getShowById } from '@/app/services/filmService';
import { IPerfomance } from '@/app/types/perfomance';
import { IProducer } from '@/app/types/producer';
import { IUser } from '@/app/types/user';
import { IShow } from '@/app/types/show';
import { IActor } from '@/app/types/actor';
import { getToken } from '@/app/services/authService';
import { AuthContext } from '@/app/context/authContext';
import EditPerformance from '@/components/admin/edit/EditPerformance';
import EditActor from '@/components/admin/edit/EditActor';
import EditProducer from '@/components/admin/edit/EditProducer';
import EditShow from '@/components/admin/edit/EditShow';
import EditUser from '@/components/admin/edit/EditUser';
import Analytics from '@/components/admin/analytics/Analytics';

export default function Panel() {
  const router = useRouter();
  const { isAuthenticated, isAdmin } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('Analytics');
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
  
  // Стан для пагінації
  const [actorsPage, setActorsPage] = useState(1);
  const [actorsLimit] = useState(10);
  const [actorsMeta, setActorsMeta] = useState({
    total: 0,
    page: 1,
    limit: 10,
    pages: 0
  });

  const [performancesPage, setPerformancesPage] = useState(1);
  const [performancesLimit] = useState(10);
  const [performancesMeta, setPerformancesMeta] = useState({
    total: 0,
    page: 1,
    limit: 10,
    pages: 0
  });

  const [producersPage, setProducersPage] = useState(1);
  const [producersLimit] = useState(10);
  const [producersMeta, setProducersMeta] = useState({
    total: 0,
    page: 1,
    limit: 10,
    pages: 0
  });

  const [showsPage, setShowsPage] = useState(1);
  const [showsLimit] = useState(10);
  const [showsMeta, setShowsMeta] = useState({
    total: 0,
    page: 1,
    limit: 10,
    pages: 0
  });

  const [usersPage, setUsersPage] = useState(1);
  const [usersLimit] = useState(10);
  const [usersMeta, setUsersMeta] = useState({
    total: 0,
    page: 1,
    limit: 10,
    pages: 0
  });

  useEffect(() => {
    // Перевірка наявності токена в localStorage
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (!token) {
      console.log('Токен відсутній, перенаправлення на сторінку логування');
      router.push('/admin/login');
      return;
    }
    
    // Перевірка статусу адміна з localStorage
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        if (userData.status !== 'admin') {
          console.log('Користувач не є адміном, перенаправлення на сторінку логування');
          router.push('/admin/login');
          return;
        }
      } catch (error) {
        console.error('Помилка парсингу даних користувача:', error);
        router.push('/admin/login');
        return;
      }
    }
    
    // Перевірка аутентифікації адміна з контексту (якщо дані вже завантажені)
    if (isAuthenticated !== undefined && isAdmin !== undefined && (!isAuthenticated || !isAdmin)) {
      console.log('Користувач не аутентифікований як адмін, перенаправлення на сторінку логування');
      router.push('/admin/login');
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      try {
        console.log('Запит до API для отримання акторів');
        if (activeTab === 'Actors') {
          const actorsData = await getActors(actorsPage, actorsLimit);
          console.log('Отримані актори:', actorsData);
          console.log('Meta дані:', actorsData.meta);
          
          if (actorsData && actorsData.actors) {
            setActors(actorsData.actors);
            setActorsMeta(actorsData.meta || { total: 0, page: 1, limit: 5, pages: 0 });
          } else {
            console.error('Неправильна структура відповіді:', actorsData);
            setActors([]);
            setActorsMeta({ total: 0, page: 1, limit: 5, pages: 0 });
          }
        } else if (activeTab === 'Events') {
          const performancesData = await getPerfomances({ page: performancesPage, limit: performancesLimit });
          console.log('Отримані вистави:', performancesData);
          if (performancesData && performancesData.performances) {
            setPerformances(performancesData.performances);
            setPerformancesMeta(performancesData.meta || { total: 0, page: 1, limit: 10, pages: 0 });
          } else {
            setPerformances([]);
            setPerformancesMeta({ total: 0, page: 1, limit: 10, pages: 0 });
          }
        } else if (activeTab === 'Producers') {
          const producersData = await getProducers(producersPage, producersLimit);
          console.log('Отримані продюсери:', producersData);
          if (producersData && producersData.producers) {
            setProducers(producersData.producers);
            setProducersMeta(producersData.meta || { total: 0, page: 1, limit: 10, pages: 0 });
          } else {
            setProducers([]);
            setProducersMeta({ total: 0, page: 1, limit: 10, pages: 0 });
          }
        } else if (activeTab === 'Users') {
          const usersData = await getUsers(usersPage, usersLimit);
          console.log('Отримані користувачі:', usersData);
          if (usersData && usersData.users) {
            setUsers(usersData.users);
            setUsersMeta(usersData.meta || { total: 0, page: 1, limit: 10, pages: 0 });
          } else {
            setUsers([]);
            setUsersMeta({ total: 0, page: 1, limit: 10, pages: 0 });
          }
        } else if (activeTab === 'Shows') {
          const showsData = await getShows(showsPage, showsLimit);
          console.log('Отримані покази:', showsData);
          if (showsData && showsData.shows) {
            setShows(showsData.shows);
            setShowsMeta(showsData.meta || { total: 0, page: 1, limit: 10, pages: 0 });
          } else {
            setShows([]);
            setShowsMeta({ total: 0, page: 1, limit: 10, pages: 0 });
          }
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
  }, [activeTab, actorsPage, performancesPage, producersPage, usersPage, showsPage, isAuthenticated, isAdmin, router]);

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

  const handleDeleteActor = async (actorId: number) => {
    setActors(prevActors => prevActors?.filter(actor => actor.id !== actorId) || []);
    // Перезавантажуємо дані після видалення
    try {
      const actorsData = await getActors(actorsPage, actorsLimit);
      if (actorsData && actorsData.actors) {
        setActors(actorsData.actors);
        setActorsMeta(actorsData.meta || { total: 0, page: 1, limit: 5, pages: 0 });
      }
    } catch (error) {
      console.error('Помилка перезавантаження акторів:', error);
    }
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

  const renderPagination = (
    currentPage: number,
    setPage: (page: number) => void,
    meta: { total: number; page: number; limit: number; pages: number },
    itemsArray: any[],
    itemName: string
  ) => (
    <div className="pagination-container">
      <div className="pagination-info">
        Показано {((currentPage - 1) * meta.limit) + 1}-{Math.min(currentPage * meta.limit, meta.total || itemsArray?.length || 0)} з {meta.total || itemsArray?.length || 0} {itemName}
        <br />
      </div>
      <div className="pagination-controls">
        <button 
          className="pagination-btn"
          onClick={() => setPage(1)}
          disabled={currentPage === 1}
          title="Перша сторінка"
        >
          ««
        </button>
        <button 
          className="pagination-btn"
          onClick={() => setPage(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          title="Попередня сторінка"
        >
          «
        </button>
        
        {Array.from({ length: Math.min(5, Math.max(1, meta.pages)) }, (_, i) => {
          let pageNum;
          if (meta.pages <= 5) {
            pageNum = i + 1;
          } else if (currentPage <= 3) {
            pageNum = i + 1;
          } else if (currentPage >= meta.pages - 2) {
            pageNum = meta.pages - 4 + i;
          } else {
            pageNum = currentPage - 2 + i;
          }
          
          return (
            <button
              key={pageNum}
              className={`pagination-btn ${currentPage === pageNum ? 'active' : ''}`}
              onClick={() => setPage(pageNum)}
            >
              {pageNum}
            </button>
          );
        })}
        
        <button 
          className="pagination-btn"
          onClick={() => setPage(Math.min(meta.pages, currentPage + 1))}
          disabled={currentPage === meta.pages}
          title="Наступна сторінка"
        >
          »
        </button>
        <button 
          className="pagination-btn"
          onClick={() => setPage(meta.pages)}
          disabled={currentPage === meta.pages}
          title="Остання сторінка"
        >
          »»
        </button>
      </div>
    </div>
  );

  return (
    <aside 
      className='elements-container'
      style={{
        width: '95%',
        maxWidth: '1600px',
        margin: '2% auto',
        minWidth: '800px',
        backgroundColor: '#081731',
        border: '2px solid #4fc3f7'
      }}
    >
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
              
              {renderPagination(performancesPage, setPerformancesPage, performancesMeta, performances, 'вистав')}
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
                      <th className="id-column">#</th>
                      <th className="name-column">Вистава</th>
                      <th className="date-column">Дата і час</th>
                      <th className="price-column">Ціна</th>
                      <th className="hall-column">Зал</th>
                      <th className="actions-column">Дії</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shows.length > 0 ? (
                      shows.map((show, index) => (
                        <tr key={show.id}>
                          <td className="id-column">{((showsPage - 1) * showsLimit) + index + 1}</td>
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
              
              {renderPagination(showsPage, setShowsPage, showsMeta, shows, 'показів')}
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
                      <th className="id-column">#</th>
                      <th className="image-column">Фото</th>
                      <th className="name-column">Ім'я</th>
                      <th className="phone-column">Телефон</th>
                      <th className="passport-column">Паспорт</th>
                      <th className="actions-column">Дії</th>
                    </tr>
                  </thead>
                  <tbody>
                    {actors && actors.length > 0 ? (
                      actors.map((actor, index) => (
                        <tr key={actor.id}>
                          <td className="id-column">{((actorsPage - 1) * actorsLimit) + index + 1}</td>
                          <td className="image-column">
                            <div className="image-placeholder">
                              <svg viewBox="0 0 24 24" width="24" height="24" fill="#b0c4de">
                                <path d="M12,12c2.21,0 4,-1.79 4,-4s-1.79,-4 -4,-4 -4,1.79 -4,4 1.79,4 4,4zM12,14c-2.67,0 -8,1.34 -8,4v2h16v-2c0,-2.66 -5.33,-4 -8,-4z"/>
                              </svg>
                            </div>
                          </td>
                          <td className="name-column" title={`${actor.first_name} ${actor.last_name}`}>
                            {`${actor.first_name} ${actor.last_name}`}
                          </td>
                          <td className="phone-column" title={actor.phone_number || 'Не вказано'}>
                            {actor.phone_number || <span className="placeholder-text">Не вказано</span>}
                          </td>
                          <td className="passport-column" title={actor.passport || 'Не вказано'}>
                            {actor.passport || <span className="placeholder-text">Не вказано</span>}
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
                        <td colSpan={6} className="empty-state">
                          Немає акторів для відображення
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              
              {renderPagination(actorsPage, setActorsPage, actorsMeta, actors, 'акторів')}
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
              
              {renderPagination(producersPage, setProducersPage, producersMeta, producers, 'продюсерів')}
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
                      <th className="id-column">#</th>
                      <th className="name-column">Ім'я</th>
                      <th className="email-column">Email</th>
                      <th className="phone-column">Телефон</th>
                      <th className="passport-column">Паспорт</th>
                      <th className="actions-column">Дії</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length > 0 ? (
                      users.map((user, index) => (
                        <tr key={user.id}>
                          <td className="id-column">{((usersPage - 1) * usersLimit) + index + 1}</td>
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
              
              {renderPagination(usersPage, setUsersPage, usersMeta, users, 'користувачів')}
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