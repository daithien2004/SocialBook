export interface AuthResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
    username: string;
    image?: string;
  };
}

export interface ResponseDto<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  meta?: any;
  path: string;
}

export interface ErrorResponseDto {
  success: false;
  statusCode: number;
  message: string | string[];
  error: string;
  timestamp: string;
  path: string;
  stack?: string;
}
