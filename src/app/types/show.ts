export interface IShow {
    id: number;
    performance_id: number;
    datetime: string;
    hall_id: number;
    price: string | number;
    performance?: {
        id: number;
        title: string;
        duration: number;
        image: string;
    };
    hall?: {
        id: number;
        hall_number: number;
    };
}