import { IShow } from './show';

export interface ITheater {
  id: number;
  name: string;
  address?: string;
  cities?: { id: number; name: string; }[];
  shows?: IShow[];
}

export interface ICreateTheater {
  name: string;
  address?: string;
  cityIds: number[];
}

export interface IUpdateTheater {
  name?: string;
  address?: string;
  cityIds?: number[];
} 