import { z } from 'zod';

export class GenerateAudioJobPayload {
  constructor(
    public readonly ttsRecordId: string,
    public readonly chapterId: string,
    public readonly voice: string,
    public readonly language: string,
    public readonly speed: number,
    public readonly format: string,
  ) {}
}

export const GenerateAudioJobPayloadSchema = z.object({
  ttsRecordId: z.string().min(1),
  chapterId: z.string().min(1),
  voice: z.string().min(1),
  language: z.string().min(1),
  speed: z.number(),
  format: z.string().min(1),
});
