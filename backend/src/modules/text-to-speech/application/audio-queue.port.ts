import { GenerateAudioJobPayload } from '@/modules/text-to-speech/application/public-api';

export const IAudioQueuePort = Symbol('IAudioQueuePort');

export interface IAudioQueuePort {
  queueAudioGeneration(payload: GenerateAudioJobPayload): Promise<void>;
}
