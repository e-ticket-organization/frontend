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
import { getToken, refreshToken } from '@/app/services/authService';
import { IShowCreate } from '@/app/types/show';

export default function Show() {

  const [performances, setPerformances] = useState<IPerfomance[]>([]);
  const [halls, setHalls] = useState<IHall[]>([]);
  const router = useRouter();

  useEffect(() => {
    const token = getToken();
    if (!token) {
      refreshToken();
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
    datetime: new Date().toISOString().slice(0, 16),
    price: '',
    hall_id: '',
    performance_id: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setShow({ ...show, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Валідація даних
      if (!show.datetime || !show.price || !show.hall_id || !show.performance_id) {
        alert('Будь ласка, заповніть всі поля');
        return;
      }

      const showDateTime = new Date(show.datetime);
      
      if (showDateTime < new Date()) {
        alert('Дата та час показу не можуть бути в минулому');
        return;
      }

      // Конвертуємо всі значення в правильні типи
      const showData: IShowCreate = {
        performance_id: Number(show.performance_id),
        datetime: showDateTime,
        date: new Date(showDateTime.toDateString()), // Витягуємо дату з datetime
        hall_id: Number(show.hall_id),
        price: Number(show.price)
      };

      // Додаткова перевірка на валідність чисел
      if (isNaN(showData.price) || isNaN(showData.hall_id) || isNaN(showData.performance_id)) {
        alert('Некоректні числові значення');
        return;
      }

      if (showData.price <= 0) {
        alert('Ціна повинна бути більше 0');
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
                <FontAwesomeIcon icon={faArrowLeft as any} /> Повернутися
            </Link>
        </button>
        <form className='show-form' onSubmit={handleSubmit}>
            <label className='form-label'>Дата та час показу:</label>
            <input 
                className='form-input' 
                placeholder='Оберіть дату та час' 
                type="datetime-local" 
                name="datetime" 
                value={show.datetime}
                onChange={handleChange} 
                required 
            />
            
            <label className='form-label'>Ціна (грн):</label>
            <input 
                className='form-input' 
                placeholder='Введіть ціну' 
                type="number" 
                step="0.01"
                min="0.01"
                name="price" 
                value={show.price} 
                onChange={handleChange} 
                required 
            />
            
            <label className='form-label'>Зал:</label>
            <select className='form-select' name="hall_id" value={show.hall_id} onChange={handleChange} required>
                <option value="">Оберіть зал</option>
                {halls.map((hall) => (
                    <option key={hall.id} value={hall.id}>
                        Зал {hall.hall_number}
                    </option>
                ))}
            </select>
            
            <label className='form-label'>Вистава:</label>
            <select className='form-select' name="performance_id" value={show.performance_id} onChange={handleChange} required>
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
