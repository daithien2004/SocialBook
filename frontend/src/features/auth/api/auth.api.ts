import { apiRequest } from '@/lib/api-client';
import {
  AuthMessageResponse,
  ResendOtpResponse,
  authMessageResponseSchema,
  resendOtpResponseSchema,
} from '../schemas/auth.schema';
import {
  ForgotPasswordRequest,
  LoginRequest,
  ResendOtpRequest,
  ResetPasswordRequest,
  SignupRequest,
  VerifyOtpRequest,
} from '../types/auth.type';

async function authPost<T = unknown>(
  path: string,
  payload?: unknown,
): Promise<T> {
  return apiRequest<T>({
    url: `/auth${path}`,
    method: 'POST',
    data: payload,
  });
}

export async function signup(
  payload: SignupRequest,
): Promise<AuthMessageResponse> {
  const response = await authPost<Record<string, unknown>>('/signup', payload);
  return authMessageResponseSchema.parse(response);
}

export async function verifyOtp(
  payload: VerifyOtpRequest,
): Promise<AuthMessageResponse> {
  const response = await authPost<Record<string, unknown>>(
    '/verify-otp',
    payload,
  );
  return authMessageResponseSchema.parse(response);
}

export async function resendOtp(
  payload: ResendOtpRequest,
): Promise<ResendOtpResponse> {
  const response = await authPost<Record<string, unknown>>(
    '/resend-otp',
    payload,
  );
  return resendOtpResponseSchema.parse(response);
}

export async function forgotPassword(
  payload: ForgotPasswordRequest,
): Promise<AuthMessageResponse> {
  const response = await authPost<Record<string, unknown>>(
    '/forgot-password',
    payload,
  );
  return authMessageResponseSchema.parse(response);
}

export async function resetPassword(
  payload: ResetPasswordRequest,
): Promise<AuthMessageResponse> {
  const response = await authPost<Record<string, unknown>>(
    '/reset-password',
    payload,
  );
  return authMessageResponseSchema.parse(response);
}

export async function login(payload: LoginRequest): Promise<AuthMessageResponse> {
  return authPost<AuthMessageResponse>('/login', payload);
}
