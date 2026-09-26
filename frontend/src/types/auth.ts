export interface LoginResponse {
    access_token: string;
    token_type: string;
}


export interface CurrentUser {
    id: string;
    organization_id: string;
    role: string;
    email: string;
    first_name: string;
    last_name: string | null;
}