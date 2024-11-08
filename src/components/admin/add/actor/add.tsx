'use client'
import React from 'react';
import './add.styles.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Link from 'next/link';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { useActorForm } from '@/app/hooks/useActorForm';

export default function Add() {
  const { actor, isLoading, error, handleChange, handleSubmit } = useActorForm();

  return (
    <section className='add-actor-container'>
      <button className='back-button'>
        <Link href="/admin">
          <FontAwesomeIcon icon={faArrowLeft} /> Повернутися
        </Link>
      </button>

      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <label>
          <input 
            type="text" 
            placeholder="Ім'я" 
            name="first_name" 
            value={actor.first_name} 
            onChange={handleChange} 
            required 
          />
        </label>
        <label>
          <input 
            type="text" 
            placeholder="Прізвище" 
            name="last_name" 
            value={actor.last_name} 
            onChange={handleChange} 
            required 
          />
        </label>
        <label>
          <input 
            type="date" 
            placeholder='Дата народження' 
            name="date_of_birth" 
            value={actor.date_of_birth} 
            onChange={handleChange}
          />
        </label>
        <label>
          <input 
            type="text" 
            placeholder='Код паспорта' 
            name="passport" 
            value={actor.passport || ''} 
            onChange={handleChange}
          />
        </label>
        <label>
          <input 
            type="tel" 
            placeholder='Номер телефону' 
            name="phone_number" 
            value={actor.phone_number || ''} 
            onChange={handleChange}
          />
        </label>
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Додавання...' : 'Додати актора'}
        </button>
      </form>
    </section>
  );
}