import { z } from 'zod';

export const authMessageResponseSchema = z.object({
  message: z.string(),
});

export const resendOtpResponseSchema = z.object({
  resendCooldown: z.number(),
});

export type AuthMessageResponse = z.infer<typeof authMessageResponseSchema>;
export type ResendOtpResponse = z.infer<typeof resendOtpResponseSchema>;