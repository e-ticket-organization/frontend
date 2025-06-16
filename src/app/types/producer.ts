export interface IProducer {
    id: number;
    first_name: string;
    last_name: string;
    phone_number: string;
    email: string;
    date_of_birth?: string;
    created_at: string;
    updated_at: string;
    bio?: string;
    photoUrl?: string;
}

export interface IProducerCreate {
    first_name: string;
    last_name: string;
    phone_number: string;
    email: string;
    date_of_birth?: string;
    bio?: string;
    photoUrl?: string;
}

