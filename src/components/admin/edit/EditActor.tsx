'use client'
import React, { useState } from 'react';
import { IActor } from '@/app/types/actor';
import { updateActor, deleteActor } from '@/app/services/filmService';
import './EditActor.css';

interface EditActorProps {
    actor: IActor & { id: number };
    onClose: () => void;
    onUpdate: (updatedActor: IActor & { id: number }) => void;
    onDelete: (actorId: number) => void;
}

const EditActor: React.FC<EditActorProps> = ({ actor, onClose, onUpdate, onDelete }) => {
    const [formData, setFormData] = useState({
        first_name: actor.first_name || '',
        last_name: actor.last_name || '',
        date_of_birth: actor.date_of_birth ? new Date(actor.date_of_birth).toISOString().split('T')[0] : '',
        passport: actor.passport || '',
        phone_number: actor.phone_number || ''
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
            if (!actor.id) {
                throw new Error('ID актора не визначений');
            }
            const updatedActor = await updateActor(actor.id, formData);
            onUpdate(updatedActor);
        } catch (error) {
            console.error('Помилка оновлення актора:', error);
        }
    };

    const handleDelete = async () => {
        if (window.confirm('Ви впевнені, що хочете видалити цього актора?')) {
            try {
                await deleteActor(actor.id);
                onDelete(actor.id);
                onClose();
            } catch (error) {
                console.error('Помилка видалення актора:', error);
            }
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>Редагувати актора</h2>
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
                        <label>Паспорт:</label>
                        <input
                            type="text"
                            name="passport"
                            value={formData.passport}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Номер телефону:</label>
                        <input
                            type="tel"
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
};

export default EditActor; 