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
    </aside>
  )
}