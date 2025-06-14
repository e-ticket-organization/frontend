import { IPerfomance } from './perfomance';
import { IHall } from './hall';
import { ITicket } from './ticket';

export interface IShow {
    id: number;
    performance_id: number;
    datetime: Date;
    price: number;
    hall_id: number;
    date: Date;
    city_id?: number;
    theater_id?: number;
    performance?: IPerfomance;
    hall?: IHall;
    city?: { id: number; name: string; };
    theater?: { id: number; name: string; address?: string; };
    tickets?: ITicket[];
}

export interface IShowCreate {
    performance_id: number;
    datetime: Date;
    price: number;
    hall_id: number;
    date: Date;
}