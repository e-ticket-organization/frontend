import { IGenre } from './genre';
import { IProducer } from './producer';
import { IActor } from './actor';

export interface IPerfomance {
    id: number;
    title: string;
    duration: number;
    image: string;
    producer: {
        id: number;
        first_name: string;
        last_name: string;
    };
    actors: {
        id: number;
        first_name: string;
        last_name: string;
    }[];
    genres: {
        id: number;
        name: string;
    }[];
    created_at?: string;
    updated_at?: string;
}