export { TextToSpeechModule } from './text-to-speech.module';
export { TextToSpeechApplicationModule } from './application/text-to-speech-application.module';
export { TextToSpeechInfrastructureModule } from './infrastructure/text-to-speech-infrastructure.module';
export { AudioWorker } from './infrastructure/workers/audio.worker';
export {
  ITextToSpeechPort,
  ITextToSpeechRepository,
  TextToSpeech,
  TTSStatus,
} from './domain';
