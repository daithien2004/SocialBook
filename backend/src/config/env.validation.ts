import { z } from 'zod';

const envValidationSchema = z.object({
  // Bắt buộc phải set trong .env
  MONGO_URI: z.string().url(),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  GOOGLE_CLIENT_ID: z.string(),
  // Optional — giá trị mặc định nằm ở env.config.ts
  PORT: z.coerce.number().int().positive().optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).optional(),
  FRONTEND_URL: z.string().url().optional(),
  REDIS_HOST: z.string().optional(),
  REDIS_PORT: z.coerce.number().int().positive().optional(),
  REDIS_PASSWORD: z.string().optional(),
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
  CACHE_TTL: z.coerce.number().int().positive().optional(),
});

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
