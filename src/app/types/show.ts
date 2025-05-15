import { IPerfomance } from './perfomance';
import { IHall } from './hall';
import { ISeat } from './seat';

export interface IShow {
    id: number;
    performance_id: number;
    datetime: string;
    price: string;
    hall_id: number;
    date: string | null;
    performance?: IPerfomance;
    hall?: IHall;
    seats: ISeat[];
}