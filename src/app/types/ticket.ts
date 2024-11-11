export interface ITicket {
    id: number;
    ticket_number: number;
    date: string;
    time: string;
    show_id: number;
    seat_id: number;
    user_id: number;
    price: number;
    discount_id: number;
    created_at: string;
    updated_at: string;
}