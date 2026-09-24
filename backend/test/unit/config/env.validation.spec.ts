import { validateEnv } from '@/config/env.validation';

describe('validateEnv', () => {
  const validEnv: Record<string, unknown> = {
    MONGO_URI: 'mongodb://localhost:27017/socialbook',
    JWT_ACCESS_SECRET: 'my-super-secret-access-token-value-1234567890',
    JWT_REFRESH_SECRET: 'my-super-secret-refresh-token-value-123456789',
    GOOGLE_CLIENT_ID: '1234567890-abcdefghij.apps.googleusercontent.com',
    GOOGLE_CLIENT_SECRET: 'google-oauth-client-secret',
    GOOGLE_CALLBACK_URL: 'http://localhost:3000/api/auth/google/callback',
  };

  it('accepts a valid environment', () => {
    const result = validateEnv(validEnv);

    expect(result.MONGO_URI).toBe(validEnv.MONGO_URI);
    expect(result.JWT_ACCESS_SECRET).toBe(validEnv.JWT_ACCESS_SECRET);
  });

  it('accepts missing optional variables (defaults live in env.config.ts)', () => {
    expect(() => validateEnv(validEnv)).not.toThrow();
  });

  it('throws when JWT_ACCESS_SECRET is missing', () => {
    const { JWT_ACCESS_SECRET, ...withoutSecret } = validEnv;

    expect(() => validateEnv(withoutSecret)).toThrow(/JWT_ACCESS_SECRET/);
  });

  it('throws when GOOGLE_CLIENT_ID is missing', () => {
    const { GOOGLE_CLIENT_ID, ...withoutGoogleClientId } = validEnv;

    expect(() => validateEnv(withoutGoogleClientId)).toThrow(
      /GOOGLE_CLIENT_ID/,
    );
  });

  it('throws when MONGO_URI is not a valid URL', () => {
    expect(() => validateEnv({ ...validEnv, MONGO_URI: 'not-a-url' })).toThrow(
      /MONGO_URI/,
    );
  });

  it('throws when a required secret is shorter than 32 characters', () => {
    expect(() =>
      validateEnv({ ...validEnv, JWT_REFRESH_SECRET: 'too-short' }),
    ).toThrow(/JWT_REFRESH_SECRET/);
  });
});
