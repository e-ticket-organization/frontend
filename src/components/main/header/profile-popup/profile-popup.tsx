import React from 'react';
import './profile-popup.styles.css';

interface ProfilePopupProps {
  onClose: () => void;
  onLogout: () => void;
}

export default function ProfilePopup({ onClose, onLogout }: ProfilePopupProps) {
  return (
    <div className="profile-popup">
      <div className="profile-popup-content">
        <a href="/user/profile">Мій профіль</a>
        <button onClick={onLogout}>Вийти</button>
      </div>
    </div>
  );
}
