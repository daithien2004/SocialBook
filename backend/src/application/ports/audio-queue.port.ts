import { GenerateAudioJobPayload } from '../text-to-speech/jobs/tts-job.payload';

export const IAudioQueuePort = Symbol('IAudioQueuePort');

export interface IAudioQueuePort {
  queueAudioGeneration(payload: GenerateAudioJobPayload): Promise<void>;
}
