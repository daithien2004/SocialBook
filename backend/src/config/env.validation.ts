import { z } from 'zod';

const envValidationSchema = z
  .object({
    // Bắt buộc phải set trong .env
    MONGO_URI: z.string().url(),
    MONGO_MAX_POOL_SIZE: z.coerce.number().int().positive().max(500).optional(),
    MONGO_MIN_POOL_SIZE: z.coerce
      .number()
      .int()
      .nonnegative()
      .max(100)
      .optional(),
    MONGO_CONNECT_TIMEOUT_MS: z.coerce
      .number()
      .int()
      .positive()
      .max(120_000)
      .optional(),
    MONGO_SERVER_SELECTION_TIMEOUT_MS: z.coerce
      .number()
      .int()
      .positive()
      .max(120_000)
      .optional(),
    MONGO_SOCKET_TIMEOUT_MS: z.coerce
      .number()
      .int()
      .positive()
      .max(600_000)
      .optional(),
    MONGO_WAIT_QUEUE_TIMEOUT_MS: z.coerce
      .number()
      .int()
      .positive()
      .max(120_000)
      .optional(),
    JWT_ACCESS_SECRET: z.string().min(32),
    JWT_REFRESH_SECRET: z.string().min(32),
    GOOGLE_CLIENT_ID: z.string(),
    GOOGLE_CLIENT_SECRET: z.string(),
    GOOGLE_CALLBACK_URL: z.string().url(),
    GITHUB_CLIENT_ID: z.string().optional(),
    GITHUB_CLIENT_SECRET: z.string().optional(),
    GITHUB_CALLBACK_URL: z.string().url().optional(),
    AUTH_COOKIE_SECURE: z.enum(['true', 'false']).optional(),
    AUTH_COOKIE_SAME_SITE: z.enum(['lax', 'strict', 'none']).optional(),
    // Optional — giá trị mặc định nằm ở env.config.ts
    // PORT=0 (IDE/preview export ra) không phải lỗi cấu hình — env.config.ts
    // sẽ fallback về 5000, nên chỉ reject giá trị âm/không phải số.
    PORT: z.coerce.number().int().nonnegative().optional(),
    NODE_ENV: z.enum(['development', 'production', 'test']).optional(),
    FRONTEND_URL: z
      .string()
      .refine((value) =>
        value
          .split(',')
          .every((origin) => z.string().url().safeParse(origin.trim()).success),
      )
      .optional(),
    REDIS_HOST: z.string().optional(),
    REDIS_PORT: z.coerce.number().int().positive().optional(),
    REDIS_PASSWORD: z.string().optional(),
    BULL_REDIS_HOST: z.string().optional(),
    BULL_REDIS_PORT: z.coerce.number().int().positive().optional(),
    BULL_REDIS_PASSWORD: z.string().optional(),
    BULL_BOARD_USER: z.string().optional(),
    BULL_BOARD_PASSWORD: z.string().optional(),
    ACCESS_TOKEN_EXPIRES_IN: z.string().optional(),
    REFRESH_TOKEN_EXPIRES_IN: z.string().optional(),
    ADMIN_USERNAME: z.string().optional(),
    ADMIN_EMAIL: z.string().optional(),
    ADMIN_PASSWORD: z.string().optional(),
    RESEND_API_KEY: z.string().optional(),
    RESEND_FROM_EMAIL: z.string().optional(),
    CLOUDINARY_CLOUD_NAME: z.string().optional(),
    CLOUDINARY_API_KEY: z.string().optional(),
    CLOUDINARY_API_SECRET: z.string().optional(),
    GOOGLE_API_KEY: z.string().optional(),
    ELEVENLABS_API_KEY: z.string().optional(),
    ELEVENLABS_VOICE_ID: z.string().optional(),
    ELEVENLABS_MODEL_ID: z.string().optional(),
    HUGGINGFACE_API_KEY: z.string().optional(),
    MODERATION_API_KEY: z.string().optional(),
    MODERATION_API_BASE_URL: z.string().url().optional(),
    MODERATION_MODEL: z.string().optional(),
    MODERATION_TIMEOUT: z.coerce.number().int().positive().optional(),
    AI_PROVIDER: z.enum(['gemini', 'chatgpt']).optional(),
    CHATGPT_API_KEY: z.string().optional(),
    CHATGPT_MODEL: z.string().optional(),
    CHATGPT_BASE_URL: z.string().url().optional(),
    CHATGPT_TIMEOUT: z.coerce.number().int().positive().optional(),
    CHROMA_URL: z.string().url().optional(),
    CHROMA_COLLECTION: z.string().optional(),
    CHROMA_CONNECT_TIMEOUT_MS: z.coerce
      .number()
      .int()
      .positive()
      .max(120_000)
      .optional(),
    CHROMA_HEADERS_TIMEOUT_MS: z.coerce
      .number()
      .int()
      .positive()
      .max(120_000)
      .optional(),
    CHROMA_BODY_TIMEOUT_MS: z.coerce
      .number()
      .int()
      .positive()
      .max(120_000)
      .optional(),
    CACHE_TTL: z.coerce.number().int().positive().optional(),
  })
  .refine(
    (config) =>
      (config.MONGO_MIN_POOL_SIZE ?? 0) <= (config.MONGO_MAX_POOL_SIZE ?? 20),
    {
      message: 'MONGO_MIN_POOL_SIZE must not exceed MONGO_MAX_POOL_SIZE',
      path: ['MONGO_MIN_POOL_SIZE'],
    },
  )
  .refine(
    (config) =>
      config.NODE_ENV !== 'production' ||
      (config.RESEND_API_KEY !== undefined &&
        config.RESEND_API_KEY.trim().length > 0),
    {
      message: 'RESEND_API_KEY is required in production',
      path: ['RESEND_API_KEY'],
    },
  )
  .refine(
    (config) =>
      config.NODE_ENV !== 'production' || config.AUTH_COOKIE_SECURE !== 'false',
    {
      message: 'AUTH_COOKIE_SECURE cannot be false in production',
      path: ['AUTH_COOKIE_SECURE'],
    },
  )
  .refine(
    (config) =>
      config.AUTH_COOKIE_SAME_SITE !== 'none' ||
      config.AUTH_COOKIE_SECURE === 'true' ||
      (config.NODE_ENV === 'production' &&
        config.AUTH_COOKIE_SECURE !== 'false'),
    {
      message: 'SameSite=None requires secure cookies',
      path: ['AUTH_COOKIE_SAME_SITE'],
    },
  );

export function shouldSkipEnvValidation(
  nodeEnv: string | undefined,
  skipFlag: string | undefined,
): boolean {
  return nodeEnv !== 'production' && skipFlag === 'true';
}

export function validateEnv(
  config: Record<string, unknown>,
): Record<string, unknown> {
  const parsed = envValidationSchema.safeParse(config);

  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Environment validation failed:\n${details}`);
  }

  return parsed.data;
}
