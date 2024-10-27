'use client'
import React, { useState } from 'react';
import './edit-user.styles.css';

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
      <form onSubmit={handleSubmit}>
        <label>
          Name:
          <input type="text" name="name" value={actor.name} onChange={handleChange} required />
        </label>
        <label>
          Date of Birth:
          <input type="date" name="dateOfBirth" value={actor.dateOfBirth} onChange={handleChange} required />
        </label>
        <label>
          Passport Code:
          <input type="text" name="passportCode" value={actor.passportCode} onChange={handleChange} required />
        </label>
        <label>
          Phone Number:
          <input type="tel" name="phoneNumber" value={actor.phoneNumber} onChange={handleChange} required />
        </label>
        <button type="submit">Add Actor</button>
      </form>
    </section>
  );
}