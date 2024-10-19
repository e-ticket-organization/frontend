'use client'
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faArrowRight } from '@fortawesome/free-solid-svg-icons';
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
      <div className={`side-bar ${isOpen ? 'open' : 'closed'}`}>
        <button className="toggle-button" onClick={() => setIsOpen(!isOpen)}>
        </button>
        {isOpen && 
        <div className="menu-content">
            <button onClick={() => handleNavigation('admin/add/actor')}>Додати актора</button>
            <button onClick={() => handleNavigation('admin/add/show')}>Додати виставу</button>
            <button onClick={() => handleNavigation('admin/add/genre')}>Додати жанр вистави</button>
            <button onClick={() => handleNavigation('admin/add/genre')}>Додати жанр вистави</button>
            <button onClick={() => handleNavigation('admin/view/sales')}>Переглянути статистику продажу</button>
        </div>
        }
      </div>
    </>
  );
}