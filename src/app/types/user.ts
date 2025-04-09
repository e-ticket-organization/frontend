export interface IUser {
    id: number;
    name: string;
    email: string;
    password?: string;
    phoneNumbers?: string;
    dateOfBirth?: string;
    age?: string | number;
}