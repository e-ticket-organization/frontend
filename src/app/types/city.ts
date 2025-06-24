import { IShow } from './show';
import { ITheater } from './theater';

export interface ICity {
  id: number;
  name: string;
  shows?: IShow[];
  theaters?: ITheater[];
  upcomingShows?: IShow[];
  showsCount?: number;
  upcomingShowsCount?: number;
}

export interface ICreateCity {
  name: string;
}

export interface IUpdateCity {
  name?: string;
} 