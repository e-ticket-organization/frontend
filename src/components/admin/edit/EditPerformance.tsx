'use client'
import React, { useState, useEffect } from 'react';
import { IPerfomance } from '@/app/types/perfomance';
import { updatePerformance, getActors, getProducers, getGenres, deletePerformance } from '@/app/services/filmService';
import './EditPerformance.css';

interface EditPerformanceProps {
    performance: IPerfomance;
    onClose: () => void;
    onUpdate: (updatedPerformance: IPerfomance) => void;
    onDelete: (performanceId: number) => void;
}

const EditPerformance: React.FC<EditPerformanceProps> = ({ performance, onClose, onUpdate, onDelete }) => {
    const [actors, setActors] = useState<any[]>([]);
    const [producers, setProducers] = useState<any[]>([]);
    const [selectedActors, setSelectedActors] = useState<{id: number, name: string}[]>([]);
    const [selectedProducer, setSelectedProducer] = useState<{id: number, name: string} | null>(
        performance.producer ? {
            id: performance.producer.id,
            name: `${performance.producer.first_name} ${performance.producer.last_name}`
        } : null
    );

    const [formData, setFormData] = useState({
        title: performance.title || '',
        duration: performance.duration || 0,
        image: performance.image || '',
        genre_ids: performance.genres?.map(genre => genre.id) || [],
        producer_id: performance.producer?.id || 0,
        actor_ids: performance.actors?.map(actor => actor.id) || []
    });

    useEffect(() => {
        const loadData = async () => {
            try {
                const [actorsData, producersData, genresData] = await Promise.all([
                    getActors(),
                    getProducers(),
                    getGenres()
                ]);
                setActors(actorsData);
                setProducers(producersData);

                // Встановлюємо початкових вибраних акторів
                const initialActors = performance.actors?.map(actor => ({
                    id: actor.id,
                    name: `${actor.first_name} ${actor.last_name}`
                })) || [];
                setSelectedActors(initialActors);
            } catch (error) {
                console.error('Помилка завантаження даних:', error);
            }
        };
        loadData();
    }, [performance]);

    const handleActorSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const actorId = Number(e.target.value);
        const actor = actors.find(a => a.id === actorId);
        
        if (actor && !selectedActors.some(sa => sa.id === actorId)) {
            const newActor = {
                id: actorId,
                name: `${actor.first_name} ${actor.last_name}`
            };
            setSelectedActors([...selectedActors, newActor]);
            setFormData(prev => ({
                ...prev,
                actor_ids: [...prev.actor_ids, actorId]
            }));
        }
        
        e.target.value = '';
    };

    const removeActor = (actorId: number) => {
        setSelectedActors(selectedActors.filter(a => a.id !== actorId));
        setFormData(prev => ({
            ...prev,
            actor_ids: prev.actor_ids.filter(id => id !== actorId)
        }));
    };

    const handleProducerSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const producerId = Number(e.target.value);
        const producer = producers.find(p => p.id === producerId);
        
        if (producer) {
            const newProducer = {
                id: producerId,
                name: `${producer.first_name} ${producer.last_name}`
            };
            setSelectedProducer(newProducer);
            setFormData(prev => ({
                ...prev,
                producer_id: producerId
            }));
        }
        
        e.target.value = '';
    };

    const removeProducer = () => {
        setSelectedProducer(null);
        setFormData(prev => ({
            ...prev,
            producer_id: 0
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.producer_id) {
            console.error('Продюсер обов\'язковий');
            return;
        }

        if (formData.actor_ids.length === 0) {
            console.error('Потрібно вибрати хоча б одного актора');
            return;
        }

        try {
            const updateData = {
                title: formData.title,
                duration: Number(formData.duration),
                image: formData.image,
                producer: formData.producer_id,
                genre_id: formData.genre_ids[0],
                actors: formData.actor_ids
            };

            console.log('Дані для оновлення:', updateData);
            const updatedPerformance = await updatePerformance(performance.id, updateData);
            onUpdate(updatedPerformance);
            onClose();
        } catch (error: any) {
            console.error('Помилка оновлення вистави:', error);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'duration' ? Number(value) : value
        }));
    };

    const handleDelete = async () => {
        if (window.confirm('Ви впевнені, що хочете видалити цю виставу?')) {
            try {
                await deletePerformance(performance.id);
                onDelete(performance.id);
                onClose();
            } catch (error) {
                console.error('Помилка видалення вистави:', error);
            }
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>Редагувати виставу</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Назва:</label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Тривалість (хв):</label>
                        <input
                            type="number"
                            name="duration"
                            value={formData.duration}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>URL зображення:</label>
                        <input
                            type="text"
                            name="image"
                            value={formData.image}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Продюсер:</label>
                        <select
                            onChange={handleProducerSelect}
                            value=""
                        >
                            <option value="">Вибрати продюсера</option>
                            {producers
                                .filter(producer => !selectedProducer || producer.id !== selectedProducer.id)
                                .map(producer => (
                                    <option key={producer.id} value={producer.id}>
                                        {`${producer.first_name} ${producer.last_name}`}
                                    </option>
                                ))
                            }
                        </select>
                        <div className="selected-producers">
                            {selectedProducer && (
                                <div className="producer-tag">
                                    <span>{selectedProducer.name}</span>
                                    <button
                                        type="button"
                                        onClick={removeProducer}
                                        className="remove-producer"
                                    >
                                        ×
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Актори:</label>
                        <select
                            onChange={handleActorSelect}
                            value=""
                        >
                            <option value="">Додати актора</option>
                            {actors
                                .filter(actor => !selectedActors.some(sa => sa.id === actor.id))
                                .map(actor => (
                                    <option key={actor.id} value={actor.id}>
                                        {`${actor.first_name} ${actor.last_name}`}
                                    </option>
                                ))
                            }
                        </select>
                        <div className="selected-actors">
                            {selectedActors.map(actor => (
                                <div key={actor.id} className="actor-tag">
                                    <span>{actor.name}</span>
                                    <button
                                        type="button"
                                        onClick={() => removeActor(actor.id)}
                                        className="remove-actor"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
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

export default EditPerformance; 