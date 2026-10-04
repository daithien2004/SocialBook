import { normalizeError } from '@/shared/presentation/error-normalizer';

export const toHandshakeError = (e: unknown): Error => {
  const { code, message } = normalizeError(e);
  return Object.assign(new Error(message), { data: { code } });
};
