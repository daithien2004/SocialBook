import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

const absoluteVersionedApiBaseUrl = z
  .url()
  .refine((value) =>
    new URL(value).pathname.replace(/\/+$/, '').endsWith('/api/v1'),
  )
  .transform((value) => value.replace(/\/+$/, ''));
const versionedApiBaseUrl = z.union([
  absoluteVersionedApiBaseUrl,
  z.literal('/api/v1'),
]);

export const env = createEnv({
  /*
   * Serverside Environment variables, not available on the client.
   * Will throw if you access these variables on the client.
   */
  server: {
    NEST_API_INTERNAL_URL: versionedApiBaseUrl.optional(),
    // Phải trùng secret với backend. Cố ý không có giá trị mặc định: thiếu biến
    // này thì proxy không verify được token, phải fail loudly lúc khởi động
    // thay vì âm thầm rơi về một khoá ai cũng biết.
    JWT_ACCESS_SECRET: z.string().min(32),
  },
  /*
   * Environment variables available on the client (and server).
   * 💡 You'll get type errors if these are not prefixed with NEXT_PUBLIC_.
   */
  client: {
    NEXT_PUBLIC_NEST_API_URL: versionedApiBaseUrl,
    NEXT_PUBLIC_SOCKET_URL: z.string().url(),
    NEXT_PUBLIC_ENABLE_CONTENT_PROTECTION: z.enum(['true', 'false']).optional(),
  },
  /*
   * Due to how Next.js bundles environment variables on Edge and Client,
   * we need to manually destructure them to make sure all are included in bundle.
   */
  runtimeEnv: {
    NEST_API_INTERNAL_URL: process.env.NEST_API_INTERNAL_URL,
    JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
    NEXT_PUBLIC_NEST_API_URL: process.env.NEXT_PUBLIC_NEST_API_URL,
    NEXT_PUBLIC_SOCKET_URL: process.env.NEXT_PUBLIC_SOCKET_URL,
    NEXT_PUBLIC_ENABLE_CONTENT_PROTECTION:
      process.env.NEXT_PUBLIC_ENABLE_CONTENT_PROTECTION,
  },
  // Skip validation when running lint or build
  // (jest bật qua jest.setup.ts: process.env.SKIP_ENV_VALIDATION = 'true')
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  // Treat empty strings as undefined
  emptyStringAsUndefined: true,
});
