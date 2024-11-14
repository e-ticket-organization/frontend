'use client'
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import './side-bar.styles.css';

export default function SideBar() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  return (
    <>
      {!isOpen && <div className="left-click-area" onClick={() => setIsOpen(true)}></div>}
      {isOpen && <div className="fullscreen-overlay" onClick={() => setIsOpen(false)}></div>}
      <div className={`side-bar ${isOpen ? 'open' : 'closed'}`}>
        <button className="toggle-button" onClick={() => setIsOpen(!isOpen)}>
        </button>
        {isOpen && 
        <div className="menu-content">
            <button onClick={() => handleNavigation('admin/add/actor')}>Додати актора</button>
            <button onClick={() => handleNavigation('admin/add/producer')}>Додати продюсера</button>
            <button onClick={() => handleNavigation('admin/add/show')}>Додати виставу</button>
            <button onClick={() => handleNavigation('admin/add/perfomance')}>Додати виступ</button>
        </div>
        }
      </div>
    </>
  );
}
