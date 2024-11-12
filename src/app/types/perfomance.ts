import { IGenre } from './genre';

export interface IPerfomance {
    id?: number;
    title: string;
    duration: number;
    producer: number; 
    image: string;
    genres?: IGenre[];
    created_at?: string;
    updated_at?: string;
}