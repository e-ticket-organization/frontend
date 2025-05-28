export interface IActor {
    id: number;
    first_name: string;
    last_name: string;
    phone_number?: string;
    date_of_birth?: string;
    passport?: string;
    created_at: string | null;
    updated_at: string | null;
    performances: any[];
    full_name: string;
  }
  
  export interface IActorCreate {
    first_name: string;
    last_name: string;
    phone_number?: string;
    date_of_birth?: string;
    passport?: string;
  }