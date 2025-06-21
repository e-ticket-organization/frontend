import React, { useState, useEffect } from 'react';
import { IShow } from '@/app/types/show';
import { IPerfomance } from '@/app/types/perfomance';
import { IHall } from '@/app/types/hall';
import { getPerfomances, getHalls, updateShow, deleteShow } from '@/app/services/filmService';
import './EditPerformance.css';

interface EditShowProps {
  show: IShow;
  onClose: () => void;
  onUpdate: (updatedShow: IShow) => void;
  onDelete: (showId: number) => void;
}

export default function EditShow({ show, onClose, onUpdate, onDelete }: EditShowProps) {
  const [performances, setPerformances] = useState<IPerfomance[]>([]);
  const [halls, setHalls] = useState<IHall[]>([]);

  const formatDateForInput = (dateString: string | Date) => {
    const date = new Date(dateString);  
    return date.toISOString().slice(0, 16);
  };

  const formatPrice = (price: number | string): string => {
    const numPrice = typeof price === 'number' ? price : parseFloat(price.toString());
    return isNaN(numPrice) ? '0.00' : numPrice.toFixed(2);
  };

  const [formData, setFormData] = useState({
    performance_id: show.performance_id.toString(),
    datetime: formatDateForInput(show.datetime),
    hall_id: show.hall_id.toString(),
    price: formatPrice(show.price)
  });
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [performancesResult, hallsData] = await Promise.all([
          getPerfomances({ limit: 100, page: 1 }),
          getHalls()
        ]);
        setPerformances(performancesResult.performances || []);
        setHalls(hallsData);
      } catch (error) {
        console.error('Помилка завантаження даних:', error);
        setError('Помилка завантаження даних');
      }
    };
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.performance_id) {
      setError('Вистава обов\'язкова');
      return;
    }

    if (!formData.hall_id) {
      setError('Зал обов\'язковий');
      return;
    }

    if (!formData.datetime) {
      setError('Дата та час обов\'язкові');
      return;
    }

    const priceValue = parseFloat(formData.price);
    if (!formData.price || isNaN(priceValue) || priceValue <= 0) {
      setError('Ціна повинна бути числом більше 0');
      return;
    }

    try {
      const updatedShow = await updateShow(show.id, {
        performance_id: Number(formData.performance_id),
        datetime: formData.datetime,
        hall_id: Number(formData.hall_id),
        price: parseFloat(formData.price)
      });

      if (!updatedShow) {
        setError('Сервер не повернув дані про оновлений показ');
        return;
      }

      const fullUpdatedShow = {
        ...updatedShow,
        performance: performances.find(p => p.id === Number(formData.performance_id)),
        hall: halls.find(h => h.id === Number(formData.hall_id))
      };

      onUpdate(fullUpdatedShow as IShow);
      onClose();
    } catch (error: any) {
      setError(error.message || 'Помилка при оновленні показу');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setError(''); // Очищаємо помилку при зміні полів
    const { name, value } = e.target;
    
    // Спеціальна обробка для поля price
    if (name === 'price') {
      // Дозволяємо тільки числа з крапкою
      const numericValue = value.replace(/[^0-9.]/g, '');
      // Запобігаємо більше однієї крапки
      const parts = numericValue.split('.');
      const formattedValue = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : numericValue;
      
      setFormData(prev => ({
        ...prev,
        [name]: formattedValue
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Ви впевнені, що хочете видалити цей показ?')) {
      try {
        await deleteShow(show.id);
        onDelete(show.id);
        onClose();
      } catch (error: any) {
        console.error('Помилка видалення показу:', error);
        setError(error.message || 'Помилка при видаленні показу');
      }
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Редагувати показ</h2>
        </div>
        <div className="modal-body">
          {error && (
            <div style={{
              backgroundColor: '#f8d7da',
              color: '#721c24',
              padding: '10px',
              borderRadius: '5px',
              marginBottom: '15px',
              border: '1px solid #f5c6cb'
            }}>
              {error}
            </div>
          )}
          
          <form id="edit-show-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Вистава:</label>
              <select
                name="performance_id"
                value={formData.performance_id}
                onChange={handleChange}
                required
              >
                <option value="">Виберіть виставу</option>
                {performances.map(performance => (
                  <option key={performance.id} value={performance.id}>
                    {performance.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Дата та час:</label>
              <input
                type="datetime-local"
                name="datetime"
                value={formData.datetime}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Зал:</label>
              <select
                name="hall_id"
                value={formData.hall_id}
                onChange={handleChange}
                required
              >
                <option value="">Виберіть зал</option>
                {halls.map(hall => (
                  <option key={hall.id} value={hall.id}>
                    Зал {hall.hall_number}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Ціна (грн):</label>
              <input
                type="text"
                name="price"
                value={formData.price}
                onChange={handleChange}
                onBlur={(e) => {
                  const value = e.target.value;
                  if (value && !isNaN(parseFloat(value))) {
                    const formatted = parseFloat(value).toFixed(2);
                    setFormData(prev => ({ ...prev, price: formatted }));
                  }
                }}
                placeholder="0.00"
                pattern="^\d+(\.\d{1,2})?$"
                title="Введіть ціну у форматі 0.00"
                required
              />
            </div>
          </form>
        </div>
        
        <div className="modal-actions">
          <button type="submit" form="edit-show-form">Зберегти зміни</button>
          <button type="button" onClick={onClose}>
            Скасувати
          </button>
          <button 
            type="button" 
            onClick={handleDelete}
            className="delete-button"
            style={{backgroundColor: '#dc3545'}}
          >
            Видалити
          </button>
        </div>
      </div>
    </div>
  );
} 