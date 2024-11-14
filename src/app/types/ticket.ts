export interface ITicket {
    id: number;
    ticket_number: string;
    date: string;
    time: string;
    show_id: number;
    seat_id: number;
    user_id: number;
    price: string;
    discount_id: number | null;
    created_at: string;
    updated_at: string;
    show: {
        id: number;
        performance_id: number;
        datetime: string;
        price: string;
        hall_id: number;
        created_at: string;
        updated_at: string;
        performance: {
            id: number;
            title: string;
            description: string;
            duration: number;
            image: string;
            producer: number;
            created_at: string | null;
            updated_at: string;
        };
        hall: {
            id: number;
            hall_number: number;
            created_at: string | null;
            updated_at: string | null;
        };
    };
    seat: {
        id: number;
        hall_id: number;
        seat_number: number;
        row: string;
        created_at: string;
        updated_at: string;
    };
    discount: null | any;
}