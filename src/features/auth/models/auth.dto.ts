export interface LoginDTO {
    email: string;
    password: string;
    mfa_code?: string;
}

export interface RegisterDTO {
    name: string;
    last_name: string;
    email: string;
    password: string;
    password_confirmation: string;
}
