'use client'
import React, { useState } from 'react';
import './panel.styles.css';
import { useRouter } from 'next/navigation';

export default function Panel() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('Events');
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
              className={activeTab === 'Directors' ? 'active' : ''} 
              onClick={() => setActiveTab('Directors')}
            >
              Directors
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
          {activeTab === 'Directors' && (
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
          {activeTab === 'Users' && (
              <>
                  <p>Ім'я</p>
                  <div className='divider'></div>
                  <p>Емейл</p>
              </>
          )}
      </div>
        {activeTab === 'Events' && (
          <div className='element-events'>
            <img src="https://storage.concert.ua/JTR/11/Fo/66e1a0404a43b/a43d.jpg:31-catalog-event_item-desktop " alt="facebook" />
            <p>element</p>
            <p>123</p>
            <p>123</p>
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
        {activeTab === 'Directors' && (
          <div className='element-actors'>
            <p>Name</p>
            <p>date of birth</p>
            <p>passport code</p>
            <p>phone number</p>
          </div>
        )}
        {activeTab === 'Users' && (
        <div className='element-users'>
          <p id='user-name'>Name</p>
          <div className='border-line'></div>
          <p id='user-email'>email</p>
          <button onClick={() => handleNavigation('admin/edit/user')} className='edit-user-button'>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
              <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
            </svg>
          </button>
        </div>
      )}
    </aside>
  )
}