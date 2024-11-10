'use client'
import React, { useState, useEffect } from 'react';
import './panel.styles.css';
import { useRouter } from 'next/navigation';
import { getPerfomances, getProducers, getUsers } from '@/app/services/filmService';
import { IPerfomance } from '@/app/types/perfomance';
import { IProducer } from '@/app/types/producer';
import { IUser } from '@/app/types/user';

export default function Panel() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('Events');
  const [performances, setPerformances] = useState<IPerfomance[]>([]);
  const [producers, setProducers] = useState<IProducer[]>([]);
  const [users, setUsers] = useState<IUser[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (activeTab === 'Events') {
          const performancesData = await getPerfomances();
          setPerformances(performancesData);
        } else if (activeTab === 'Producers') {
          const producersData = await getProducers();
          setProducers(producersData);
        } else if (activeTab === 'Users') {
          const usersData = await getUsers();
          setUsers(usersData);
        }
      } catch (error) {
        console.error('Помилка завантаження даних:', error);
      }
    };
    
    fetchData();
  }, [activeTab]);

  const handleNavigation = (path: string) => {
    router.push(path);
  };
  return (
    <aside className='elements-container'>
        <div className='buttons-container'>
            <button 
              className={activeTab === 'Events' ? 'active' : ''} 
              onClick={() => setActiveTab('Events')}
            >
              Events
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
                  <p>Опис</p>
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
            {performances.map((performance) => (
              <div key={performance.id} className='element-events'>
                <img src={performance.image} alt={performance.title} />
                <p>{performance.title}</p>
                <p>{performance.duration} хв</p>
              </div>
            ))}
          </div>
        )}
        {activeTab === 'Actors' && (
          <div className='element-actors'>
            <p>Name</p>
            <p>date of birth</p>
            <p>passport code</p>
            <p>phone number</p>
          </div>
        )}
        {activeTab === 'Producers' && (
          <div className='elements-list'>
            {producers.map((producer) => (
              <div key={producer.id} className='element-producers'>
                <p>{`${producer.first_name} ${producer.last_name}`}</p>
                <p>{producer.date_of_birth}</p>
                <p>{producer.email}</p>
                <p>{producer.phone_number}</p>
              </div>
            ))}
          </div>
        )}
        {activeTab === 'Users' && (
          <div className='elements-list'>
            {users.map((user) => (
              <div key={user.id} className='element-users'>
                <p id='user-name'>{user.name}</p>
                <p id='user-email'>{user.email}</p>
                <button onClick={() => handleNavigation('admin/edit/user')} className='edit-user-button'>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                    <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
    </aside>
  )
}