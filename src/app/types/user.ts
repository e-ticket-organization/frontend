export interface IUser {
    id: number;
    name: string;
    email: string;
    password?: string;
    phoneNumbers?: string | null;
    dateOfBirth?: string | null;
    status?: string;
    emailVerifiedAt?: string | null;
    rememberToken?: string | null;
    stripeCustomerId?: string | null;
    newsletterSubscription?: boolean;
    created_at?: string | null;
    updated_at?: string | null;
}