'use client';

import React, { useState, useEffect } from 'react';
import ProfileSettings from './profile';
import './profile.styles.css';
import TicketsProfile from './tickets-profile';
import { useRouter } from 'next/navigation';

type TabType = 'main' | 'settings' | 'tickets';

export default function MainProfile() {
  const [activeTab, setActiveTab] = useState<TabType>('settings');
  const router = useRouter();

  useEffect(() => {
    if (activeTab === 'main') {
      router.push('/');
    }
  }, [activeTab, router]);

  const renderContent = () => {
    switch (activeTab) {
      case 'settings':
        return <ProfileSettings />;
      case 'tickets':
        return <TicketsProfile />;
      default:
        return <TicketsProfile />;
    }
  };

  return (
    <div className="main-profile-container">
      <div className="profile-sidebar">
        <div onClick={() => setActiveTab('main')} className={`sidebar-item ${activeTab === 'main' ? 'active' : ''}`}>
            Головна
        </div>
        <div 
          className={`sidebar-item ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          Налаштування профілю
        </div>
        <div 
          className={`sidebar-item ${activeTab === 'tickets' ? 'active' : ''}`}
          onClick={() => setActiveTab('tickets')}
        >
          Мої квитки
        </div>
        
      </div>
      <div className="profile-content">
        {renderContent()}
      </div>
    </div>
  );
}
