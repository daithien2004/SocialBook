export { TextToSpeechApplicationModule } from './text-to-speech-application.module';
export {
  GenerateAudioJobPayload,
  GenerateAudioJobPayloadSchema,
} from './jobs/tts-job.payload';
export { GenerateChapterAudioCommand } from './commands/generate-chapter-audio/generate-chapter-audio.command';
export { GenerateBookAudioCommand } from './commands/generate-book-audio/generate-book-audio.command';
export { IAudioQueuePort } from './audio-queue.port';
