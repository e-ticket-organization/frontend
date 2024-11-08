export interface User {
    id: number
    name: string
    email: string
    password: string
    phone_numbers: string
    status: string 
    age: number
    created_at: string
    updated_at: string
}

export interface LoginCredentials {
    email: string
    password: string
}

export interface RegisterCredentials extends LoginCredentials {
    name: string
    email: string
    password: string
    password_confirmation: string
}