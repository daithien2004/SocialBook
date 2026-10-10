import { z } from 'zod';

export const accessTokenResponseSchema = z.object({
  accessToken: z.string(),
});

export const resendOtpResponseSchema = z.object({
  resendCooldown: z.number(),
});

export type AccessTokenResponse = z.infer<typeof accessTokenResponseSchema>;
export type ResendOtpResponse = z.infer<typeof resendOtpResponseSchema>;
