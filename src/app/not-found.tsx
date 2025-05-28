'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import './not-found.css';

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="notfound-bg">
      <div className="notfound-container">
        <h1 className="notfound-title">500</h1>
        <h2 className="notfound-subtitle">Помилка сервера</h2>
        <p className="notfound-text">Йой, здається, щось пішло не так. Спробуйте знову пізніше.</p>
        <button
          onClick={() => router.push('/')}
          className="notfound-btn"
        >
          Повернутися на головну
        </button>
      </div>
    </div>
  );
} 