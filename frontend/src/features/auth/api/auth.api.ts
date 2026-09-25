import { getCsrfToken } from '@/lib/utils';
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

interface RelayEnvelope {
  data?: unknown;
  meta?: unknown;
  warning?: unknown;
  message?: unknown;
}

export interface BffAuthError {
  status: number;
  data: unknown;
  message: string;
}

function unwrapRelayPayload(payload: unknown): unknown {
  if (payload && typeof payload === 'object') {
    const envelope = payload as RelayEnvelope;
    if ('meta' in envelope || 'warning' in envelope) {
      return {
        data: envelope.data,
        meta: envelope.meta,
        warning: envelope.warning,
        message: envelope.message,
      };
    }
    if ('data' in envelope && envelope.data !== undefined) {
      return envelope.data;
    }
  }
  return payload;
}

async function readResponseBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (text.length === 0) return undefined;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

export async function bffAuthPost<T = unknown>(
  path: string,
  payload: unknown,
): Promise<T> {
  const csrfToken = getCsrfToken();
  const response = await fetch(`/api/auth${path}`, {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
      ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}),
    },
    body: JSON.stringify(payload),
  });

  const body = await readResponseBody(response);

  if (!response.ok) {
    const message =
      body && typeof body === 'object' && 'message' in body
        ? String((body as { message: unknown }).message)
        : 'Đã có lỗi xảy ra. Vui lòng thử lại.';
    throw { status: response.status, data: body, message } satisfies BffAuthError;
  }

  return unwrapRelayPayload(body) as T;
}

export async function signup(payload: SignupRequest): Promise<AuthMessageResponse> {
  const response = await bffAuthPost<Record<string, unknown>>('/signup', payload);
  return authMessageResponseSchema.parse(response);
}

export async function verifyOtp(
  payload: VerifyOtpRequest,
): Promise<AuthMessageResponse> {
  const response = await bffAuthPost<Record<string, unknown>>('/verify-otp', payload);
  return authMessageResponseSchema.parse(response);
}

export async function resendOtp(payload: ResendOtpRequest): Promise<ResendOtpResponse> {
  const response = await bffAuthPost<Record<string, unknown>>('/resend-otp', payload);
  return resendOtpResponseSchema.parse(response);
}

export async function forgotPassword(
  payload: ForgotPasswordRequest,
): Promise<AuthMessageResponse> {
  const response = await bffAuthPost<Record<string, unknown>>(
    '/forgot-password',
    payload,
  );
  return authMessageResponseSchema.parse(response);
}

export async function resetPassword(
  payload: ResetPasswordRequest,
): Promise<AuthMessageResponse> {
  const response = await bffAuthPost<Record<string, unknown>>('/reset-password', payload);
  return authMessageResponseSchema.parse(response);
}

export async function login(payload: LoginRequest): Promise<AuthMessageResponse> {
  return bffAuthPost<AuthMessageResponse>('/login', payload);
}
