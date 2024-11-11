export interface IUser {
    id: number;
    name: string;
    email: string;
    password?: string;
    phone_numbers?: string;
    age?: string | number;
}
