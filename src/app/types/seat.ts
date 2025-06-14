export interface ISeat {
    status: string;
    id: number;
    seat_id?: number;
    number: number;
    row: number;
    created_at: string;
    updated_at: string;
    is_booked?: boolean;
}