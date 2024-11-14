export interface IActor {
    id: number;
    first_name: string;
    last_name: string;
    phone_number?: string;
    date_of_birth?: string;
    passport?: string;
  }
  
  export interface IActorCreate {
    first_name: string;
    last_name: string;
    phone_number?: string;
    date_of_birth?: string;
    passport?: string;
  }