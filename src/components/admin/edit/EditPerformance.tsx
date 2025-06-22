'use client'
import React, { useState, useEffect } from 'react';
import { IPerfomance } from '@/app/types/perfomance';
import { updatePerformance, getAllActors, getAllProducers, getGenres, deletePerformance, getCities, getTheaters } from '@/app/services/filmService';
import { ICity } from '@/app/types/city';
import { ITheater } from '@/app/types/theater';
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
    const [genres, setGenres] = useState<any[]>([]);
    const [cities, setCities] = useState<ICity[]>([]);
    const [theaters, setTheaters] = useState<ITheater[]>([]);
    const [selectedActors, setSelectedActors] = useState<{id: number, name: string}[]>([]);
    const [selectedGenres, setSelectedGenres] = useState<{id: number, name: string}[]>([]);

    const [formData, setFormData] = useState(() => {
        // Беремо дані з першого show, якщо вони є
        const firstShow = performance.shows?.[0] as any;
        
        // Визначаємо producer_id з різних можливих джерел
        let producerId = 0;
        if (performance.producer_id && performance.producer_id !== 0) {
            producerId = performance.producer_id;
        } else if (performance.producer?.id && performance.producer.id !== 0) {
            producerId = performance.producer.id;
        }
        
        console.log('Ініціалізація producer_id:', {
            'performance.producer_id': performance.producer_id,
            'performance.producer?.id': performance.producer?.id,
            'обраний producerId': producerId
        });
        
        const initialData = {
            title: performance.title || '',
            description: performance.description || '',
            duration: performance.duration || 0,
            image: performance.image || '',
            producer_id: producerId,
            genre_ids: performance.genre_ids || [],
            actor_ids: performance.actor_ids || [],
            premiereDate: performance.premiereDate || '',
            price: firstShow?.price ? Number(firstShow.price) : (performance.price || 0),
            city_id: firstShow?.city_id || (performance.city_id || 0),
            theater_id: firstShow?.theater_id || (performance.theater_id || 0)
        };

        return initialData;
    });

    useEffect(() => {
        const loadData = async () => {
            try {


                const [actorsData, producersData, genresData, citiesData, theatersData] = await Promise.all([
                    getAllActors(),
                    getAllProducers(),
                    getGenres(),
                    getCities(),
                    getTheaters()
                ]);
                setActors(actorsData);
                setProducers(producersData);
                setGenres(genresData);
                setCities(citiesData);
                setTheaters(theatersData);

                // Встановлюємо початкових вибраних акторів
                const initialActors = performance.actors?.map(actor => ({
                    id: actor.id,
                    name: `${actor.first_name} ${actor.last_name}`
                })) || [];
                setSelectedActors(initialActors);

                // Встановлюємо початкових вибраних жанрів
                const initialGenres = performance.genres?.map(genre => ({
                    id: genre.id,
                    name: genre.name
                })) || [];
                setSelectedGenres(initialGenres);

                // Встановлюємо дату прем'єри з найранішого show, якщо є
                let premiereDate = performance.premiereDate || '';
                if (performance.shows && performance.shows.length > 0) {
                    const sortedShows = performance.shows.sort((a, b) => 
                        new Date(a.datetime).getTime() - new Date(b.datetime).getTime()
                    );
                    const firstShow = sortedShows[0];
                    if (firstShow.date) {
                        premiereDate = typeof firstShow.date === 'string' ? firstShow.date : new Date(firstShow.date).toISOString().split('T')[0];
                    } else if (firstShow.datetime) {
                        premiereDate = new Date(firstShow.datetime).toISOString().split('T')[0];
                    }
                }


                // Беремо дані з першого show для price, city_id, theater_id
                const firstShow = performance.shows?.[0] as any;

                // Визначаємо producer_id з різних можливих джерел
                let producerId = 0;
                if (performance.producer_id && performance.producer_id !== 0) {
                    producerId = performance.producer_id;
                } else if (performance.producer?.id && performance.producer.id !== 0) {
                    producerId = performance.producer.id;
                }
                
                console.log('useEffect producer_id логіка:', {
                    'performance.producer_id': performance.producer_id,
                    'performance.producer?.id': performance.producer?.id,
                    'обраний producerId': producerId
                });

                // Оновлюємо formData з правильними genre_ids та actor_ids та всіма іншими полями
                const newFormData = {
                    title: performance.title || '',
                    description: performance.description || '',
                    duration: performance.duration || 0,
                    image: performance.image || '',
                    producer_id: producerId,
                    genre_ids: initialGenres.map(g => g.id),
                    actor_ids: initialActors.map(a => a.id),
                    premiereDate: premiereDate,
                    price: firstShow?.price ? Number(firstShow.price) : (performance.price || 0),
                    city_id: firstShow?.city_id || (performance.city_id || 0),
                    theater_id: firstShow?.theater_id || (performance.theater_id || 0)
                };

                console.log('Performance object:', performance);
                console.log('Producer ID from performance:', performance.producer_id);
                console.log('Producer object from performance:', performance.producer);
                console.log('Producers list:', producersData);
                console.log('Final formData:', newFormData);
                
                // Додаткова перевірка продюсера
                if (performance.producer_id) {
                    const foundProducer = producersData.find(p => p.id === performance.producer_id);
                    console.log('Found producer by performance.producer_id:', foundProducer);
                }
                
                if (performance.producer?.id) {
                    const foundProducer = producersData.find(p => p.id === performance.producer!.id);
                    console.log('Found producer by performance.producer.id:', foundProducer);
                }

                setFormData(newFormData);
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
            const newSelectedActors = [...selectedActors, newActor];
            setSelectedActors(newSelectedActors);
            setFormData(prev => ({
                ...prev,
                actor_ids: newSelectedActors.map(a => a.id)
            }));
        }
        
        e.target.value = '';
    };

    const removeActor = (actorId: number) => {
        const newSelectedActors = selectedActors.filter(a => a.id !== actorId);
        setSelectedActors(newSelectedActors);
        setFormData(prev => ({
            ...prev,
            actor_ids: newSelectedActors.map(a => a.id)
        }));
    };

    const handleGenreSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const genreId = Number(e.target.value);
        const genre = genres.find(g => g.id === genreId);
        
        if (genre && !selectedGenres.some(sg => sg.id === genreId)) {
            const newGenre = {
                id: genreId,
                name: genre.name
            };
            const newSelectedGenres = [...selectedGenres, newGenre];
            setSelectedGenres(newSelectedGenres);
            setFormData(prev => ({
                ...prev,
                genre_ids: newSelectedGenres.map(g => g.id)
            }));
        }
        
        e.target.value = '';
    };

    const removeGenre = (genreId: number) => {
        const newSelectedGenres = selectedGenres.filter(g => g.id !== genreId);
        setSelectedGenres(newSelectedGenres);
        setFormData(prev => ({
            ...prev,
            genre_ids: newSelectedGenres.map(g => g.id)
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.producer_id) {
            console.error('Продюсер обов\'язковий');
            return;
        }

        if (!formData.city_id) {
            console.error('Місто обов\'язкове');
            return;
        }

        if (!formData.theater_id) {
            console.error('Театр обов\'язковий');
            return;
        }

        if (!formData.premiereDate) {
            console.error('Дата прем\'єри обов\'язкова');
            return;
        }

        if (!formData.price || formData.price <= 0) {
            console.error('Ціна повинна бути більше 0');
            return;
        }

        try {
            console.log('Відправляємо дані для оновлення:', formData);
            console.log('ID вистави для оновлення:', performance.id);
            
            const updatedPerformance = await updatePerformance(performance.id, formData);
            
            console.log('Отримана оновлена вистава:', updatedPerformance);
            
            if (!updatedPerformance || !updatedPerformance.id) {
                console.error('Сервер повернув некоректні дані для оновленої вистави:', updatedPerformance);
                alert('Помилка: сервер не повернув валідні дані про оновлену виставу. Перевірте з\'єднання та спробуйте знову.');
                return;
            }
            
            console.log('Виклик onUpdate з даними:', updatedPerformance);
            onUpdate(updatedPerformance);
            
            alert('Вистава успішно оновлена!');
            onClose();
        } catch (error: any) {
            console.error('Повна помилка оновлення вистави:', error);
            console.error('Стек помилки:', error.stack);
            
            let errorMessage = 'Невідома помилка';
            
            if (error.message) {
                errorMessage = error.message;
            } else if (typeof error === 'string') {
                errorMessage = error;
            }
            
            alert(`Помилка при оновленні вистави: ${errorMessage}`);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        
        if (name === 'duration' || name === 'price' || name === 'producer_id' || name === 'city_id' || name === 'theater_id') {
            const numValue = value === '' ? 0 : Number(value);

            // Додаємо логування для producer_id
            if (name === 'producer_id') {
                console.log('Producer ID changed to:', numValue);
                console.log('Producer value from select:', value);
            }

            setFormData(prev => ({
                ...prev,
                [name]: numValue,
                // Якщо змінюється місто, скидаємо театр
                ...(name === 'city_id' && numValue !== prev.city_id ? { theater_id: 0 } : {})
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
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
                <div className="modal-header">
                    <h2>Редагувати виставу</h2>
                </div>
                <div className="modal-body">
                    <form id="edit-performance-form" onSubmit={handleSubmit}>
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
                        <label>Опис:</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            required
                            rows={4}
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
                            type="url"
                            name="image"
                            value={formData.image}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="form-group">
                        <label>Продюсер:</label>
                        <select
                            name="producer_id"
                            value={formData.producer_id && formData.producer_id !== 0 ? formData.producer_id : ''}
                            onChange={handleChange}
                            required
                        >
                            <option value="">Виберіть продюсера</option>
                            {producers.map(producer => (
                                <option key={producer.id} value={producer.id}>
                                    {`${producer.first_name} ${producer.last_name}`}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Місто:</label>
                        <select
                            name="city_id"
                            value={formData.city_id && formData.city_id !== 0 ? formData.city_id : ''}
                            onChange={handleChange}
                            required
                        >
                            <option value="">Виберіть місто</option>
                            {cities.map(city => (
                                <option key={city.id} value={city.id}>
                                    {city.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Театр:</label>
                        <select
                            name="theater_id"
                            value={formData.theater_id && formData.theater_id !== 0 ? formData.theater_id : ''}
                            onChange={handleChange}
                            required
                            disabled={!formData.city_id}
                        >
                            <option value="">
                                {formData.city_id ? 'Виберіть театр' : 'Спочатку виберіть місто'}
                            </option>
                            {theaters
                                .filter(theater => 
                                    !formData.city_id || 
                                    theater.cities?.some(city => city.id === formData.city_id)
                                )
                                .map(theater => (
                                    <option key={theater.id} value={theater.id}>
                                        {theater.name}
                                    </option>
                                ))
                            }
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Жанри:</label>
                        <select
                            onChange={handleGenreSelect}
                            value=""
                        >
                            <option value="">Додати жанр</option>
                            {genres
                                .filter(genre => !selectedGenres.some(sg => sg.id === genre.id))
                                .map(genre => (
                                    <option key={genre.id} value={genre.id}>
                                        {genre.name}
                                    </option>
                                ))
                            }
                        </select>
                        <div className="selected-genres">
                            {selectedGenres.map(genre => (
                                <div key={genre.id} className="genre-tag">
                                    <span>{genre.name}</span>
                                    <button
                                        type="button"
                                        onClick={() => removeGenre(genre.id)}
                                        className="remove-genre"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
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
                    </form>
                </div>
                <div className="modal-actions">
                    <button type="submit" form="edit-performance-form">Зберегти зміни</button>
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

export default EditPerformance; 