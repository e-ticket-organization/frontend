'use client'
import React, { useState } from 'react';
import './show.styles.css';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';

export default function Show() {
  const [show, setShow] = useState({
    time: '',
    price: '',
    hall: '',
    perfomance: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setShow({ ...show, [name]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Show added:', show);
  };

  

  return (
    <section className='add-show-container'>
        <button className='back-button'>
            <Link href="/admin">
                <FontAwesomeIcon icon={faArrowLeft} /> Повернутися
            </Link>
        </button>
      <form className='show-form' onSubmit={handleSubmit}>
          <input className='form-input' placeholder='Введіть час' type="text" name="time" value={show.time} onChange={handleChange} required />
          <input className='form-input' placeholder='Введіть ціну' type="number" name="price" value={show.price} onChange={handleChange} required />
          <input className='form-input' placeholder='Введіть номер зали' type="number" name="hall" value={show.hall} onChange={handleChange} required />
          <label className='form-label'>Виступ:</label>
          <select className='form-select' name="perfomance" value={show.perfomance} onChange={handleChange} required>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
          </select>
        <button className='submit-button' type="submit">Add Show</button>
      </form>
    </section>
  );
}
