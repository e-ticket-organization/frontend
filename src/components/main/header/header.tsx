'use client';

import React, { useState, useContext } from 'react';
import './header.styles.css';
import AuthPopup from '@/components/main/header/auth-popup/auth-popup';
import Search from '@/components/main/header/search/search';
import { AuthContext } from '@/app/context/authContext';
import { logout as logoutService } from '@/app/services/authService';
import ProfilePopup from './profile-popup/profile-popup';

export default function Header() {
  const { isAuthenticated, logout } = useContext(AuthContext);
  const [isAuthPopupOpen, setIsAuthPopupOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isProfilePopupOpen, setIsProfilePopupOpen] = useState(false);

  const handleCloseAuthPopup = () => {
    setIsAuthPopupOpen(false);
  };

  const handleToggleSearch = () => {
    setIsSearchOpen((prev) => !prev);
  };

  const handleCloseSearch = () => {
    setIsSearchOpen(false);
  };

  const handleAuthAction = async () => {
    if (isAuthenticated) {
      try {
        await logout();
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } catch (error) {
        console.error('Помилка при виході:', error);
      }
    } else {
      setIsAuthPopupOpen(true);
    }
  };

  const handleProfileClick = () => {
    if (isAuthenticated) {
      setIsProfilePopupOpen(!isProfilePopupOpen);
    } else {
      setIsAuthPopupOpen(true);
    }
  };

  return (
    <nav className='container'>
      <svg id='logo' width="125" height="45" viewBox="0 0 403 50" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M0 49V1H47.125V6H6V22H45.4062V27H6V44H48V49H0ZM54 33V28H78V33H54ZM108.938 49V6H84.9375V1H138.938V6H114.938V49H108.938ZM147.875 49V1H153.875V49H147.875ZM163.875 25.625V24.375C163.875 20.125 164.083 16.5625 164.5 13.6875C164.917 10.7917 165.635 8.4375 166.656 6.625C167.677 4.8125 169.062 3.42708 170.812 2.46875C172.583 1.51042 174.802 0.864583 177.469 0.53125C180.135 0.177083 183.344 0 187.094 0H199.688C203.979 0 207.594 0.208333 210.531 0.625C213.49 1.02083 215.865 1.82292 217.656 3.03125C219.469 4.21875 220.781 5.97917 221.594 8.3125C222.406 10.625 222.812 13.6979 222.812 17.5312H216.812C216.812 14.5104 216.542 12.1667 216 10.5C215.458 8.8125 214.542 7.59375 213.25 6.84375C211.979 6.09375 210.24 5.63542 208.031 5.46875C205.823 5.28125 203.042 5.1875 199.688 5.1875H187.094C184.115 5.1875 181.604 5.28125 179.562 5.46875C177.521 5.63542 175.854 6.04167 174.562 6.6875C173.292 7.3125 172.312 8.3125 171.625 9.6875C170.958 11.0625 170.5 12.9375 170.25 15.3125C170 17.6875 169.875 20.7083 169.875 24.375V25.625C169.875 29.1667 170 32.1042 170.25 34.4375C170.5 36.7708 170.958 38.6354 171.625 40.0312C172.312 41.4271 173.292 42.4688 174.562 43.1562C175.854 43.8438 177.521 44.2917 179.562 44.5C181.604 44.7083 184.115 44.8125 187.094 44.8125H199.688C203.042 44.8125 205.823 44.7396 208.031 44.5938C210.24 44.4479 211.979 44.0208 213.25 43.3125C214.542 42.6042 215.458 41.4271 216 39.7812C216.542 38.1146 216.812 35.7812 216.812 32.7812H222.812C222.812 36.6146 222.406 39.6771 221.594 41.9688C220.781 44.2604 219.469 45.9896 217.656 47.1562C215.865 48.3021 213.49 49.0625 210.531 49.4375C207.594 49.8125 203.979 50 199.688 50H187.094C182.406 50 178.552 49.6771 175.531 49.0312C172.51 48.4062 170.146 47.2396 168.438 45.5312C166.75 43.8229 165.562 41.3646 164.875 38.1562C164.208 34.9479 163.875 30.7708 163.875 25.625ZM232.938 49V1H238.938V22H246.906L277.938 1H286.938L252.938 24.5L287.938 49H278.938L246.938 27H238.938V49H232.938ZM295.938 49V1H343.062V6H301.938V22H341.344V27H301.938V44H343.938V49H295.938ZM372.875 49V6H348.875V1H402.875V6H378.875V49H372.875Z" fill="url(#paint0_linear_38_5)"/>
        <defs>
          <linearGradient id="paint0_linear_38_5" x1="-6" y1="20" x2="432" y2="20" gradientUnits="userSpaceOnUse">
            <stop stopColor="#486CCB"/>
            <stop offset="1" stopColor="#E414DC"/>
          </linearGradient>
        </defs>
      </svg>
      <ol>
        <li>
          <a href="/movies">Plays</a>
        </li>
        <li>
          <a href="/releases">Releases</a>
        </li>
        <li>
          <Search />
        </li>
        <li>
          <svg width="20" height="22" viewBox="0 0 20 22" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18.8801 15.5671C18.0499 14.6751 16.4966 13.3332 16.4966 8.9375C16.4966 5.59883 14.1557 2.92617 10.9992 2.27047V1.375C10.9992 0.615742 10.3839 0 9.62503 0C8.8662 0 8.25089 0.615742 8.25089 1.375V2.27047C5.0944 2.92617 2.75347 5.59883 2.75347 8.9375C2.75347 13.3332 1.20015 14.6751 0.369991 15.5671C0.112178 15.8443 -0.00211873 16.1756 2.97081e-05 16.5C0.00475627 17.2047 0.557764 17.875 1.37933 17.875H17.8707C18.6923 17.875 19.2457 17.2047 19.25 16.5C19.2522 16.1756 19.1379 15.8439 18.8801 15.5671ZM2.90171 15.8125C3.81351 14.6107 4.81038 12.6186 4.81511 8.96242C4.81511 8.95383 4.81253 8.94609 4.81253 8.9375C4.81253 6.27945 6.96698 4.125 9.62503 4.125C12.2831 4.125 14.4375 6.27945 14.4375 8.9375C14.4375 8.94609 14.435 8.95383 14.435 8.96242C14.4397 12.6191 15.4366 14.6111 16.3484 15.8125H2.90171ZM9.62503 22C11.1427 22 12.3737 20.7689 12.3737 19.25H6.87632C6.87632 20.7689 8.10737 22 9.62503 22Z" fill="white"/>
          </svg>
        </li>
        <li>
          <div className='profile-icon' onClick={handleProfileClick}>
            {isAuthenticated ? (
              <div className="profile-circle">
                U
              </div>
            ) : (
              'Увійти'
            )}
          </div>
        </li>
      </ol>
      {isAuthPopupOpen && !isAuthenticated && (
        <AuthPopup onClose={handleCloseAuthPopup} />
      )}
      {isProfilePopupOpen && isAuthenticated && (
        <ProfilePopup 
          onClose={() => setIsProfilePopupOpen(false)}
          onLogout={handleAuthAction}
        />
      )}
    </nav>
  );
}