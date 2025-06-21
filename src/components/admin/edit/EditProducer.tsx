'use client'
import React, { useState } from 'react';
import { IProducer } from '@/app/types/producer';
import { updateProducer, deleteProducer } from '@/app/services/filmService';
import './EditProducer.css';

interface EditProducerProps {
    producer: IProducer & { id: number };
    onClose: () => void;
    onUpdate: (updatedProducer: IProducer & { id: number }) => void;
    onDelete: (producerId: number) => void;
}

const EditProducer: React.FC<EditProducerProps> = ({ producer, onClose, onUpdate, onDelete }) => {
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

    const handleDelete = async () => {
        if (window.confirm('Ви впевнені, що хочете видалити цього продюсера?')) {
            try {
                await deleteProducer(producer.id);
                onDelete(producer.id);
                onClose();
            } catch (error) {
                console.error('Помилка видалення продюсера:', error);
            }
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>Редагувати продюсера</h2>
                </div>
                <div className="modal-body">
                    <form id="edit-producer-form" onSubmit={handleSubmit}>
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
                    </form>
                </div>
                <div className="modal-actions">
                    <button type="submit" form="edit-producer-form">Зберегти зміни</button>
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
};

export default EditProducer; 