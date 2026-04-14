export interface UserResponse {
    email: string;
    password?: string;
    permissions: string[];
    token?: string;
}

export interface LoginCredentials {
    email: string;
    password: string;
}