import type { GenerateAudioJobPayload } from './jobs/tts-job.payload';

export abstract class AudioQueuePort {
  abstract queueAudioGeneration(
    payload: GenerateAudioJobPayload,
  ): Promise<void>;
}
