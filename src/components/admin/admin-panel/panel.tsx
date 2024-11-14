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
        if (activeTab === 'Actors') {
          const actorsData = await getActors();
          setActors(actorsData);
        } else if (activeTab === 'Events') {
          const performancesData = await getPerfomances();
          setPerformances(performancesData);
        } else if (activeTab === 'Producers') {
          const producersData = await getProducers();
          setProducers(producersData);
        } else if (activeTab === 'Users') {
          const usersData = await getUsers();
          setUsers(usersData);
        } else if (activeTab === 'Shows') {
          const showsData = await getShows();
          setShows(showsData);
        }
      } catch (error) {
        console.error('Помилка завантаення даних:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
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

      <div className='tab-labels'>
        {activeTab === 'Events' && (
          <>
            <p>Фотографія</p>
            <div className='divider'></div>
            <p>Назва</p>
            <div className='divider'></div>
            <p>Тривалість</p>
          </>
        )}
        {activeTab === 'Shows' && (
          <>
            <p>Вистава</p>
            <div className='divider'></div>
            <p>Дата та час</p>
            <div className='divider'></div>
            <p>Зал</p>
            <div className='divider'></div>
            <p>Ціна</p>
          </>
        )}
        {activeTab === 'Actors' && (
          <>
            <p>Ім'я</p>
            <div className='divider'></div>
            <p>Дата народження</p>
            <div className='divider'></div>
            <p>Код паспорта</p>
            <div className='divider'></div>
            <p>Номер телефону</p>
          </>
        )}
        {activeTab === 'Producers' && (
          <>
            <p>Ім'я</p>
            <div className='divider'></div>
            <p>Дата народження</p>
            <div className='divider'></div>
            <p>Емейл</p>
            <div className='divider'></div>
            <p>Номер телефону</p>
          </>
        )}
        {activeTab === 'Users' && (
          <>
            <p id='user_name'>Ім'я</p>
            <div className='divider'></div>
            <p>Емейл</p>
          </>
        )}
      </div>

      {activeTab === 'Events' && (
        <div className='elements-list'>
          {isLoading ? (
            renderLoader()
          ) : Array.isArray(performances) && performances.length > 0 ? (
            performances.map((performance) => (
              <div key={performance.id} className='element-events'>
                <img src={performance.image} alt={performance.title} />
                <p>{performance.title}</p>
                <p>{performance.duration} хв</p>
                <button 
                  onClick={() => handleEditPerformance(performance)} 
                  className='edit-performance-button'
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
                  </svg>
                </button>
              </div>
            ))
          ) : (
            <p>Немає доступних вистав</p>
          )}
        </div>
      )}
      {activeTab === 'Shows' && (
        <div className='elements-list'>
          {isLoading ? (
            renderLoader()
          ) : Array.isArray(shows) && shows.length > 0 ? (
            shows.map((show) => (
              <div key={show.id} className='element-shows'>
                <p>{show.performance?.title || 'Завантаження...'}</p>
                <p>{new Date(show.datetime).toLocaleString('uk-UA')}</p>
                <p>Зал {show.hall?.hall_number || 'Завантаження...'}</p>
                <p>{show.price} грн</p>
                <button 
                  onClick={() => handleEditShow(show)}
                  className='edit-show-button'
                  style={{background: "none", border: "none"}}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                    <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
                  </svg>
                </button>
              </div>
            ))
          ) : (
            <p>Немає доступних показів</p>
          )}
        </div>
      )}
      {activeTab === 'Actors' && (
        <div className='actors-list'>
          {isLoading ? (
            renderLoader()
          ) : Array.isArray(actors) && actors.length > 0 ? (
            actors.map((actor) => (
              <div key={actor.id} className='actor-item'>
                <p>{`${actor.first_name} ${actor.last_name}`}</p>
                <p>{actor.date_of_birth ? new Date(actor.date_of_birth).toLocaleDateString('uk-UA') : ''}</p>
                <p>{actor.passport}</p>
                <p>{actor.phone_number}</p>
                <button 
                  onClick={() => handleEditActor(actor)} 
                  className='edit-actor-button'
                  style={{background: "none", border: "none"}}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                    <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
                  </svg>
                </button>
              </div>
            ))
          ) : (
            <p>Немає доступних акторів</p>
          )}
        </div>
      )}
      {activeTab === 'Producers' && (
        <div className='elements-list'>
          {isLoading ? (
            renderLoader()
          ) : Array.isArray(producers) && producers.length > 0 ? (
            producers.map((producer) => (
              <div key={producer.id} className='element-producers'>
                <p>{`${producer.first_name} ${producer.last_name}`}</p>
                <p>{producer.date_of_birth}</p>
                <p>{producer.email}</p>
                <p>{producer.phone_number}</p>
                <button 
                  onClick={() => handleEditProducer(producer)}
                  className='edit-producer-button'
                  style={{background: "none", border: "none"}}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                    <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
                  </svg>
                </button>
              </div>
            ))
          ) : (
            <p>Немає доступних продюсерів</p>
          )}
        </div>
      )}
      {activeTab === 'Users' && (
        <div className='elements-list'>
          {isLoading ? (
            renderLoader()
          ) : Array.isArray(users) && users.length > 0 ? (
            users.map((user) => (
              <div key={user.id} className='element-users'>
                <p id='user-name'>{user.name}</p>
                <p id='user-email'>{user.email}</p>
                <button 
                  onClick={() => handleEditUser(user)}
                  className='edit-user-button'
                  style={{background: "none", border: "none"}}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                    <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
                  </svg>
                </button>
              </div>
            ))
          ) : (
            <p>Немає доступних користувачів</p>
          )}
        </div>
      )}
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