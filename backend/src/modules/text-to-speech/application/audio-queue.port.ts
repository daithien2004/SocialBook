import type { GenerateAudioJobPayload } from './jobs/tts-job.payload';

export const IAudioQueuePort = Symbol('IAudioQueuePort');

export interface IAudioQueuePort {
  queueAudioGeneration(payload: GenerateAudioJobPayload): Promise<void>;
}
