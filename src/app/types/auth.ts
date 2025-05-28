export interface User {
    id: number
    name: string
    email: string
    password: string
    phone_numbers: string
    status: string 
    date_of_birth: string
    created_at: string
    updated_at: string
    dateOfBirth?: string | null
    phoneNumbers?: string | null
    stripeCustomerId?: string | null
    emailVerifiedAt?: string | null
    rememberToken?: string | null
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
    phoneNumbers?: string
    dateOfBirth?: string
}

export interface AuthState {
    user: User | null
    token: string | null
    refreshToken: string | null
    isLoading: boolean
    error: string | null
    isAuthenticated: boolean
    isAdmin: boolean
}

export interface AuthContextType {
    user: User | null
    token: string | null
    refreshToken: string | null
    isLoading?: boolean
    error?: string | null
    isAuthenticated: boolean
    isAdmin: boolean
    login: (credentials: LoginCredentials) => Promise<void>
    register: (credentials: RegisterCredentials) => Promise<void>
    logout: () => Promise<void>
    refreshAuthToken: () => Promise<string | null>
    updateUserData?: (updatedUser: User) => void
    getCurrentUser?: () => Promise<User | null>
    admin_login?: (credentials: LoginCredentials) => Promise<void>
}