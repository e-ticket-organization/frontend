'use client'
import React, { useState } from 'react';
import { IUser } from '@/app/types/user';
import { updateUser, deleteUser } from '@/app/services/filmService';
import './EditActor.css'; 

interface EditUserProps {
    user: IUser;
    onClose: () => void;
    onUpdate: (updatedUser: IUser) => void;
    onDelete: (userId: number) => void;
}

const EditUser: React.FC<EditUserProps> = ({ user, onClose, onUpdate, onDelete }) => {
    const [formData, setFormData] = useState({
        email: user.email || ''
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
            if (!user.id) {
                throw new Error('ID користувача не визначений');
            }
            const updatedUser = await updateUser(user.id, formData);
            onUpdate(updatedUser);
        } catch (error) {
            console.error('Помилка оновлення користувача:', error);
        }
    };

    const handleDelete = async () => {
        if (window.confirm('Ви впевнені, що хочете видалити цього користувача?')) {
            try {
                await deleteUser(user.id);
                onDelete(user.id);
                onClose();
            } catch (error) {
                console.error('Помилка видалення користувача:', error);
            }
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>Редагувати користувача</h2>
                <form onSubmit={handleSubmit}>
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

export default EditUser; 