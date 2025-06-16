export interface IActor {
    id: number;
    first_name: string;
    last_name: string;
    phone_number: string;
    date_of_birth: Date;
    passport: string;
    created_at: Date | null;
    updated_at: Date | null;
    performances: any[];
    full_name: string;
    bio?: string;
    photoUrl?: string;
    birthDate?: string;
    education?: string;
    achievements?: string[];
}
  
export interface IActorCreate {
    first_name: string;
    last_name: string;
    phone_number: string;
    date_of_birth: Date;
    passport: string;
}