import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const env = createEnv({
  /*
   * Serverside Environment variables, not available on the client.
   * Will throw if you access these variables on the client.
   */
  server: {
    NEST_API_INTERNAL_URL: z.url().optional(),
  },
  /*
   * Environment variables available on the client (and server).
   * 💡 You'll get type errors if these are not prefixed with NEXT_PUBLIC_.
   */
  client: {
    NEXT_PUBLIC_NEST_API_URL: z.string().url(),
    NEXT_PUBLIC_SOCKET_URL: z.string().url(),
  },
  /*
   * Due to how Next.js bundles environment variables on Edge and Client,
   * we need to manually destructure them to make sure all are included in bundle.
   */
  runtimeEnv: {
    NEST_API_INTERNAL_URL: process.env.NEST_API_INTERNAL_URL,
    NEXT_PUBLIC_NEST_API_URL: process.env.NEXT_PUBLIC_NEST_API_URL,
    NEXT_PUBLIC_SOCKET_URL: process.env.NEXT_PUBLIC_SOCKET_URL,
  },
  // Skip validation when running lint or build
  // (jest bật qua jest.setup.ts: process.env.SKIP_ENV_VALIDATION = 'true')
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  // Treat empty strings as undefined
  emptyStringAsUndefined: true,
});
