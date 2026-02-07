import { TextToSpeech, TTSStatus } from '../entities/text-to-speech.entity';

export abstract class ITextToSpeechRepository {
    abstract findById(id: string): Promise<TextToSpeech | null>;
    abstract findByChapterId(chapterId: string): Promise<TextToSpeech | null>;
    abstract findCompletedByChapterId(chapterId: string): Promise<TextToSpeech | null>;
    abstract findExisting(chapterId: string, language: string, voice: string): Promise<TextToSpeech | null>;
    abstract findAllByBookId(bookId: string): Promise<TextToSpeech[]>;
    abstract save(tts: TextToSpeech): Promise<TextToSpeech>; // Return updated entity usually
    abstract updateStatus(id: string, status: TTSStatus, errorMessage?: string): Promise<void>;
    abstract deleteByChapterId(chapterId: string): Promise<void>;
}
