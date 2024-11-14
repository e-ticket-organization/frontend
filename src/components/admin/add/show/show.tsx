'use client'
import React, { useEffect, useState } from 'react';
import './show.styles.css';
import Link from 'next/link';
import { addPerfomance, addShow, getHalls, getPerfomances } from '@/app/services/filmService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { IPerfomance } from '@/app/types/perfomance';
import { IHall } from '@/app/types/hall';
import { useRouter } from 'next/navigation';
import { getToken } from '@/app/services/authService';
import { IShow } from '@/app/types/show';

export default function Show() {


  const [performances, setPerformances] = useState<IPerfomance[]>([]);
  const [halls, setHalls] = useState<IHall[]>([]);
  const router = useRouter();



  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push('/login');
      return;
    }

    const fetchData = async () => {
      const performancesData = await getPerfomances();
      setPerformances(performancesData);
      const hallsData = await getHalls();
      setHalls(hallsData);
    };
    fetchData();
  }, [router]);

  const [show, setShow] = useState({
    id: 0,
    time: new Date().toISOString().slice(0, 16),
    price: '',
    hall: '',
    perfomance: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setShow({ ...show, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Валідація даних
      if (!show.time || !show.price || !show.hall || !show.perfomance) {
        alert('Будь ласка, заповніть всі поля');
        return;
      }

      // Перевірка дати
      const showDate = new Date(show.time);
      if (showDate < new Date()) {
        alert('Дата показу не може бути в минулому');
        return;
      }

      // Конвертуємо всі значення в правильні типи
      const showData = {
        performance_id: Number(show.perfomance),
        datetime: showDate.toISOString(),
        hall_id: Number(show.hall),
        price: Number(show.price) // Явно конвертуємо в число
      };

      // Додаткова перевірка на валідність чисел
      if (isNaN(showData.price) || isNaN(showData.hall_id) || isNaN(showData.performance_id)) {
        alert('Некоректні числові значення');
        return;
      }

      console.log('Підготовлені дані для відправки:', showData);

      const response = await addShow(showData);
      console.log('Відповідь від сервера:', response);
      
      alert('Показ успішно додано!');
      router.push('/admin');
    } catch (error: any) {
      console.error('Повна помилка:', error);
      
      const errorMessage = error.response?.data?.message 
        || error.response?.data?.error 
        || error.message 
        || 'Невідома помилка';
      
      alert(`Помилка при додаванні показу: ${errorMessage}`);
    }
  };

  

  return (
    <section className='add-show-container'>
        <button className='back-button'>
            <Link href="/admin">
                <FontAwesomeIcon icon={faArrowLeft} /> Повернутися
            </Link>
        </button>
        <form className='show-form' onSubmit={handleSubmit}>
            <input 
                className='form-input' 
                placeholder='Оберіть дату та час' 
                type="datetime-local" 
                name="time" 
                value={show.time}
                onChange={handleChange} 
                required 
            />
            <input 
                className='form-input' 
                placeholder='Введіть ціну' 
                type="number" 
                name="price" 
                value={show.price} 
                onChange={handleChange} 
                required 
            />
            <label className='form-label'>Зал:</label>
            <select className='form-select' name="hall" value={show.hall} onChange={handleChange} required>
                <option value="">Оберіть зал</option>
                {halls.map((hall) => (
                    <option key={hall.id} value={hall.id}>
                        {hall.hall_number}
                    </option>
                ))}
            </select>
            <label className='form-label'>Вистава:</label>
            <select className='form-select' name="perfomance" value={show.perfomance} onChange={handleChange} required>
                <option value="">Оберіть виставу</option>
                {performances.map((performance) => (
                    <option key={performance.id} value={performance.id}>
                        {performance.title}
                    </option>
                ))}
            </select>
            <button className='submit-button' type="submit">Додати показ</button>
        </form>
    </section>
  );
}
