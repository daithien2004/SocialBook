import { apiRequest } from '@/lib/api-client';
import {
  AccessTokenResponse,
  ResendOtpResponse,
  accessTokenResponseSchema,
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

export async function signup(payload: SignupRequest): Promise<void> {
  await authPost('/signup', payload);
}

export async function verifyOtp(payload: VerifyOtpRequest): Promise<void> {
  await authPost('/verify-otp', payload);
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
): Promise<void> {
  await authPost('/forgot-password', payload);
}

export async function resetPassword(
  payload: ResetPasswordRequest,
): Promise<void> {
  await authPost('/reset-password', payload);
}

export async function login(
  payload: LoginRequest,
): Promise<AccessTokenResponse> {
  const response = await authPost<unknown>('/login', payload);
  return accessTokenResponseSchema.parse(response);
}
