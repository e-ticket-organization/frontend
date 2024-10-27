'use client'
import React, { useState } from 'react';
import './perfomance.styles.css';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';

export default function Perfomance() {
  const [perfomance, setPerfomance] = useState({
    title: '',
    duration: '',
    image: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setPerfomance({ ...perfomance, [name]: value });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPerfomance({ ...perfomance, image: URL.createObjectURL(file) });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Perfomance added:', perfomance);
  };    
  

  return (
    <section className='add-perfomance-container'>
        <button className='back-button'>
            <Link href="/admin">
                <FontAwesomeIcon icon={faArrowLeft} /> Повернутися
            </Link>
        </button>
      <form className='perfomance-form' onSubmit={handleSubmit}>
          <input className='form-input' placeholder='Введіть назву' type="text" name="title" value={perfomance.title} onChange={handleChange} required />
          <input className='form-input' placeholder='Введіть тривалість' type="number" name="duration" value={perfomance.duration} onChange={handleChange} required />
          <input className='form-input' type="file" accept="image/*" onChange={handleImageChange} />
          {perfomance.image && <img src={perfomance.image} alt="Selected" className='preview-image' />}
          <button className='submit-button' type="submit">Додати виставу</button>
      </form>
    </section>
  );
}
