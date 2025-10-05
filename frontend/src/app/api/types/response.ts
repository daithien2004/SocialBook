export interface AuthResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    avatar?: string;
  };
}
// Định nghĩa type cho ResponseDto từ backend
export interface ResponseDto<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  meta?: any;
  path: string;
}

// Định nghĩa type cho ErrorResponseDto từ backend
export interface ErrorResponseDto {
  success: false;
  statusCode: number;
  message: string | string[];
  error: string;
  timestamp: string;
  path: string;
  stack?: string;
}
