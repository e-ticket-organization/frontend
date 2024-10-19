'use client'
import React, { useState } from 'react';
import './panel.styles.css';

export default function Panel() {
  const [activeTab, setActiveTab] = useState('Events');

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
          </div>
        )}
    </aside>
  )
}