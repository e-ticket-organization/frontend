'use client'
import React, { useEffect, useState } from 'react';
import './show.styles.css';
import Link from 'next/link';
import { addShow, getHalls, getAllPerformances, getCities, getTheaters, getTheatersByCity } from '@/app/services/filmService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { IPerfomance } from '@/app/types/perfomance';
import { IHall } from '@/app/types/hall';
import { ICity } from '@/app/types/city';
import { ITheater } from '@/app/types/theater';
import { useRouter } from 'next/navigation';
import { getToken, refreshToken } from '@/app/services/authService';
import { IShowCreate } from '@/app/types/show';

export default function Show() {
  const [performances, setPerformances] = useState<IPerfomance[]>([]);
  const [halls, setHalls] = useState<IHall[]>([]);
  const [cities, setCities] = useState<ICity[]>([]);
  const [theaters, setTheaters] = useState<ITheater[]>([]);
  const [filteredTheaters, setFilteredTheaters] = useState<ITheater[]>([]);
  const router = useRouter();

  useEffect(() => {
    const token = getToken();
    if (!token) {
      refreshToken();
    }

    const fetchData = async () => {
      try {
        const [performancesData, hallsData, citiesData, theatersData] = await Promise.all([
          getAllPerformances(),
          getHalls(),
          getCities(),
          getTheaters()
        ]);
        setPerformances(performancesData);
        setHalls(hallsData);
        setCities(citiesData);
        setTheaters(theatersData);
      } catch (error) {
        console.error('Помилка завантаження даних:', error);
      }
    };
    fetchData();
  }, [router]);

  const [show, setShow] = useState({
    datetime: new Date().toISOString().slice(0, 16),
    price: '',
    hall_id: '',
    performance_id: '',
    city_id: '',
    theater_id: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setShow({ ...show, [name]: value });
    
    // Якщо змінилося місто, завантажуємо театри для цього міста
    if (name === 'city_id') {
      if (value) {
        // Завантажуємо театри для обраного міста
        getTheatersByCity(Number(value))
          .then(cityTheaters => {
            setFilteredTheaters(cityTheaters);
            // Скидаємо вибраний театр
            setShow(prev => ({ ...prev, theater_id: '', [name]: value }));
          })
          .catch(error => {
            console.error('Помилка завантаження театрів:', error);
            setFilteredTheaters([]);
            setShow(prev => ({ ...prev, theater_id: '', [name]: value }));
          });
      } else {
        setFilteredTheaters([]);
        setShow(prev => ({ ...prev, theater_id: '', [name]: value }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Валідація даних
      if (!show.datetime || !show.price || !show.hall_id || !show.performance_id || !show.city_id || !show.theater_id) {
        alert('Будь ласка, заповніть всі обов\'язкові поля (включаючи місто та театр)');
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
        price: Number(show.price),
        city_id: Number(show.city_id),
        theater_id: Number(show.theater_id)
      };

      // Додаткова перевірка на валідність чисел
      if (isNaN(showData.price) || isNaN(showData.hall_id) || isNaN(showData.performance_id) || isNaN(showData.city_id) || isNaN(showData.theater_id)) {
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

            <label className='form-label'>Місто:</label>
            <select className='form-select' name="city_id" value={show.city_id} onChange={handleChange} required>
                <option value="">Оберіть місто</option>
                {cities.map((city) => (
                    <option key={city.id} value={city.id}>
                        {city.name}
                    </option>
                ))}
            </select>

            <label className='form-label'>Театр:</label>
            <select className='form-select' name="theater_id" value={show.theater_id} onChange={handleChange} required>
                <option value="">
                  {show.city_id ? 'Оберіть театр' : 'Спочатку оберіть місто'}
                </option>
                {(show.city_id ? filteredTheaters : theaters).map((theater) => (
                    <option key={theater.id} value={theater.id}>
                        {theater.name}
                    </option>
                ))}
            </select>
            
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
