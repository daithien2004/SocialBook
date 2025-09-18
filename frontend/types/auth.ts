export interface AuthResponse {
  accessToken: string;
}

export interface SignupDto {
  email: string;
  password: string;
}

export interface LoginDto {
  email: string;
  password: string;
}
