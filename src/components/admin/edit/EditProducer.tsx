'use client'
import React, { useState } from 'react';
import { IProducer } from '@/app/types/producer';
import { updateProducer } from '@/app/services/filmService';
import './EditProducer.css';

interface EditProducerProps {
    producer: IProducer & { id: number };
    onClose: () => void;
    onUpdate: (updatedProducer: IProducer & { id: number }) => void;
}

const EditProducer: React.FC<EditProducerProps> = ({ producer, onClose, onUpdate }) => {
    const [formData, setFormData] = useState<IProducer>({
        id: producer.id,
        first_name: producer.first_name,
        last_name: producer.last_name,
        date_of_birth: producer.date_of_birth ? new Date(producer.date_of_birth).toISOString().split('T')[0] : '',
        email: producer.email,
        phone_number: producer.phone_number,
        created_at: producer.created_at,
        updated_at: producer.updated_at
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const updatedProducer = await updateProducer(producer.id, formData);
            
            onUpdate({
                ...updatedProducer,
                id: producer.id
            });
            
            onClose();
        } catch (error) {
            console.error('Помилка оновлення продюсера:', error);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>Редагувати продюсера</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Ім'я:</label>
                        <input
                            type="text"
                            name="first_name"
                            value={formData.first_name}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Прізвище:</label>
                        <input
                            type="text"
                            name="last_name"
                            value={formData.last_name}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Дата народження:</label>
                        <input
                            type="date"
                            name="date_of_birth"
                            value={formData.date_of_birth}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Email:</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Телефон:</label>
                        <input
                            type="text"
                            name="phone_number"
                            value={formData.phone_number}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="modal-actions">
                        <button type="submit">Зберегти зміни</button>
                        <button type="button" onClick={onClose}>
                            Скасувати
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditProducer; 