import React, { useState, useEffect } from 'react';
import { IShow } from '@/app/types/show';
import { IPerfomance } from '@/app/types/perfomance';
import { IHall } from '@/app/types/hall';
import { getPerfomances, getHalls, updateShow, deleteShow } from '@/app/services/filmService';
import './EditActor.css';

interface EditShowProps {
  show: IShow;
  onClose: () => void;
  onUpdate: (updatedShow: IShow) => void;
  onDelete: (showId: number) => void;
}

export default function EditShow({ show, onClose, onUpdate, onDelete }: EditShowProps) {
  const [performances, setPerformances] = useState<IPerfomance[]>([]);
  const [halls, setHalls] = useState<IHall[]>([]);

  const formatDateForInput = (dateString: string) => {
    const date = new Date(dateString);  
    return date.toISOString().slice(0, 16);
  };

  const [formData, setFormData] = useState({
    performance_id: show.performance_id.toString(),
    datetime: formatDateForInput(show.datetime),
    hall_id: show.hall_id.toString(),
    price: show.price.toString()
  });
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [performancesData, hallsData] = await Promise.all([
          getPerfomances(),
          getHalls()
        ]);
        setPerformances(performancesData);
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
    try {
      const updatedShow = await updateShow(show.id, {
        performance_id: Number(formData.performance_id),
        datetime: formData.datetime,
        hall_id: Number(formData.hall_id),
        price: Number(formData.price)
      });

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
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleDelete = async () => {
    if (window.confirm('Ви впевнені, що хочете видалити цей показ?')) {
      try {
        await deleteShow(show.id);
        onDelete(show.id);
        onClose();
      } catch (error) {
        console.error('Помилка видалення показу:', error);
      }
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Редагувати показ</h2>
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Вистава:</label>
            <select
              name="performance_id"
              value={formData.performance_id}
              onChange={handleChange}
            >
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
            />
          </div>

          <div className="form-group">
            <label>Зал:</label>
            <select
              name="hall_id"
              value={formData.hall_id}
              onChange={handleChange}
            >
              {halls.map(hall => (
                <option key={hall.id} value={hall.id}>
                  Зал {hall.hall_number}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Ціна:</label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
            />
          </div>

          <div className="modal-actions">
            <button type="submit">Зберегти зміни</button>
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
        </form>
      </div>
    </div>
  );
} 