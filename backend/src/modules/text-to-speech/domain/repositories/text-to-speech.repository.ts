import { TextToSpeech, TTSStatus } from '../entities/text-to-speech.entity';

export abstract class TextToSpeechRepository {
  abstract findById(id: string): Promise<TextToSpeech | null>;
  abstract findExisting(
    chapterId: string,
    language: string,
    voice: string,
    speed: number,
    format: string,
  ): Promise<TextToSpeech | null>;
  abstract save(tts: TextToSpeech): Promise<TextToSpeech>; // Return updated entity usually
  abstract updateStatus(
    id: string,
    status: TTSStatus,
    errorMessage?: string,
  ): Promise<void>;
  abstract deleteByChapterId(chapterId: string): Promise<void>;
}
