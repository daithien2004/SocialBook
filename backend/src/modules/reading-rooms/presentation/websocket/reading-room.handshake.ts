import { normalizeError } from '@/shared/platform/errors/error-normalizer';

export const toHandshakeError = (e: unknown): Error => {
  const { code, message } = normalizeError(e);
  return Object.assign(new Error(message), { data: { code } });
};
