'use client'
import React, { useState } from 'react';
import './add.styles.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Link from 'next/link';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';

export default function Add() {
  const [actor, setActor] = useState({
    name: '',
    dateOfBirth: '',
    passportCode: '',
    phoneNumber: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setActor({ ...actor, [name]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Actor added:', actor);
  };

  return (
    <section className='add-actor-container'>
      <button className='back-button'>
            <Link href="/admin">
                <FontAwesomeIcon icon={faArrowLeft} /> Повернутися
            </Link>
        </button>
      <form onSubmit={handleSubmit}>
        <label>
          <input type="text" placeholder='Ім`я' name="name" value={actor.name} onChange={handleChange} required />
        </label>
        <label>
          <input type="date" placeholder='Дата народження' name="dateOfBirth" value={actor.dateOfBirth} onChange={handleChange} required />
        </label>
        <label>
          <input type="text" placeholder='Код паспорта' name="passportCode" value={actor.passportCode} onChange={handleChange} required />
        </label>
        <label>
          <input type="tel" placeholder='Номер телефону' name="phoneNumber" value={actor.phoneNumber} onChange={handleChange} required />
        </label>
        <button type="submit">Додати актора</button>
      </form>
    </section>
  );
}