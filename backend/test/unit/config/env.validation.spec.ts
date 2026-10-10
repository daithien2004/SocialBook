import { shouldSkipEnvValidation, validateEnv } from '@/config/env.validation';

const validEnvironment = {
  MONGO_URI: 'mongodb://localhost:27017/socialbook?replicaSet=rs0',
  JWT_ACCESS_SECRET: 'a'.repeat(32),
  JWT_REFRESH_SECRET: 'b'.repeat(32),
  GOOGLE_CLIENT_ID: 'google-client-id',
  GOOGLE_CLIENT_SECRET: 'google-client-secret',
  GOOGLE_CALLBACK_URL: 'http://localhost:3000/api/auth/google/callback',
};

describe('validateEnv', () => {
  it('does not allow skipping validation in production', () => {
    expect(shouldSkipEnvValidation('production', 'true')).toBe(false);
    expect(shouldSkipEnvValidation('development', 'true')).toBe(true);
    expect(shouldSkipEnvValidation('test', 'true')).toBe(true);
  });

  it('requires a mail provider key in production', () => {
    expect(() =>
      validateEnv({ ...validEnvironment, NODE_ENV: 'production' }),
    ).toThrow('RESEND_API_KEY is required in production');
  });

  it('allows the development mail logger without a provider key', () => {
    expect(() =>
      validateEnv({ ...validEnvironment, NODE_ENV: 'development' }),
    ).not.toThrow();
  });

  it('accepts a configured provider key in production', () => {
    expect(() =>
      validateEnv({
        ...validEnvironment,
        NODE_ENV: 'production',
        RESEND_API_KEY: 're_production_key',
      }),
    ).not.toThrow();
  });

  it('rejects insecure auth cookies in production', () => {
    expect(() =>
      validateEnv({
        ...validEnvironment,
        NODE_ENV: 'production',
        RESEND_API_KEY: 're_production_key',
        AUTH_COOKIE_SECURE: 'false',
      }),
    ).toThrow('AUTH_COOKIE_SECURE cannot be false in production');
  });

  it('requires secure cookies when SameSite is none', () => {
    expect(() =>
      validateEnv({
        ...validEnvironment,
        AUTH_COOKIE_SAME_SITE: 'none',
      }),
    ).toThrow('SameSite=None requires secure cookies');
  });
});
