import { IShow } from './show';

export interface ITheater {
  id: number;
  name: string;
  address?: string;
  cities?: { id: number; name: string; }[];
  shows?: IShow[];
} 