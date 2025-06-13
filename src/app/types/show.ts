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
    performance?: IPerfomance;
    hall?: IHall;
    tickets?: ITicket[];
}

export interface IShowCreate {
    performance_id: number;
    datetime: Date;
    price: number;
    hall_id: number;
    date: Date;
}