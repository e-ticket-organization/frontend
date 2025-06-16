import { IGenre } from './genre';
import { IProducer } from './producer';
import { IActor } from './actor';

export interface IPerfomance {
    id: number;
    title: string;
    duration: number;
    image: string;
    producerId: number;
    created_at: string | null;
    updated_at: string | null;
    producer: {
        id: number;
        first_name: string;
        last_name: string;
        phone_number: string;
        email: string;
        date_of_birth: string;
    };
    genres: Array<{
        id: number;
        name: string;
    }>;
    actors: Array<{
        id: number;
        first_name: string;
        last_name: string;
        date_of_birth: string;
        passport: string | null;
        phone_number: string;
        created_at: string | null;
        updated_at: string | null;
    }>;
    shows: Array<{
        id: number;
        performance_id: number;
        datetime: string;
        price: string;
        hall_id: number;
        date: string | null;
    }>;
    description: string;
    premiereDate?: string;
    price?: number;
}

export interface IPerfomanceCreate {
    title: string;
    description?: string;
    duration: number;
    image: string;
    genre_ids: number[];
    premiereDate?: string;
    price?: number;
    actor_ids: number[];
    producer_id: number;
}