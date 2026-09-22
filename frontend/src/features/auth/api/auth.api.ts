import { NESTJS_AUTH_ENDPOINTS } from '@/constants/server-endpoints';
import { apiRequest } from '@/lib/nestjs-client-api';
import {
  AuthMessageResponse,
  ResendOtpResponse,
  authMessageResponseSchema,
  resendOtpResponseSchema,
} from '../schemas/auth.schema';
import {
  ForgotPasswordRequest,
  ResendOtpRequest,
  ResetPasswordRequest,
  SignupRequest,
  VerifyOtpRequest,
} from '../types/auth.type';

export async function signup(payload: SignupRequest): Promise<AuthMessageResponse> {
  const response = await apiRequest<Record<string, unknown>>({
    url: NESTJS_AUTH_ENDPOINTS.signup,
    method: 'POST',
    data: payload,
  });
  return authMessageResponseSchema.parse(response);
}

export async function verifyOtp(
  payload: VerifyOtpRequest,
): Promise<AuthMessageResponse> {
  const response = await apiRequest<Record<string, unknown>>({
    url: NESTJS_AUTH_ENDPOINTS.verifyOtp,
    method: 'POST',
    data: payload,
  });
  return authMessageResponseSchema.parse(response);
}

export async function resendOtp(payload: ResendOtpRequest): Promise<ResendOtpResponse> {
  const response = await apiRequest<Record<string, unknown>>({
    url: NESTJS_AUTH_ENDPOINTS.resendOtp,
    method: 'POST',
    data: payload,
  });
  return resendOtpResponseSchema.parse(response);
}

export async function forgotPassword(
  payload: ForgotPasswordRequest,
): Promise<AuthMessageResponse> {
  const response = await apiRequest<Record<string, unknown>>({
    url: NESTJS_AUTH_ENDPOINTS.forgotPassword,
    method: 'POST',
    data: payload,
  });
  return authMessageResponseSchema.parse(response);
}

export async function resetPassword(
  payload: ResetPasswordRequest,
): Promise<AuthMessageResponse> {
  const response = await apiRequest<Record<string, unknown>>({
    url: NESTJS_AUTH_ENDPOINTS.resetPassword,
    method: 'POST',
    data: payload,
  });
  return authMessageResponseSchema.parse(response);
}