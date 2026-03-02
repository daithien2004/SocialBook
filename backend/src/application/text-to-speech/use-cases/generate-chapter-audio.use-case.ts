import { Injectable, BadRequestException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { ITextToSpeechRepository } from '@/domain/text-to-speech/repositories/text-to-speech.repository.interface';
import { ITextToSpeechProvider } from '@/domain/text-to-speech/interfaces/text-to-speech.provider.interface';
import { IChapterRepository } from '@/domain/chapters/repositories/chapter.repository.interface';
import { TextToSpeech, TTSStatus } from '@/domain/text-to-speech/entities/text-to-speech.entity';
import { LanguageDetectorService } from '@/domain/text-to-speech/services/language-detector.service';
import { IIdGenerator } from '@/shared/domain/id-generator.interface';

interface GenerateAudioOptions {
    voice?: string;
    speed?: number;
    language?: string;
    format?: string;
    forceRegenerate?: boolean;
}

@Injectable()
export class GenerateChapterAudioUseCase {
    constructor(
        private readonly ttsRepository: ITextToSpeechRepository,
        private readonly ttsProvider: ITextToSpeechProvider,
        private readonly chapterRepository: IChapterRepository,
        private readonly idGenerator: IIdGenerator,
    ) { }

    async execute(chapterId: string, options: GenerateAudioOptions = {}): Promise<any> {
        // 1. Validation (Optional, can rely on repository or value objects)

        // 2. Get Chapter
        const chapter = await this.chapterRepository.findById(chapterId as any); // Casting for now as ChapterId mismatch might occur
        if (!chapter) {
            throw new NotFoundException('Chapter not found');
        }

        // 3. Prepare Text
        const text = chapter.paragraphs.map(p => p.content).join('\n\n');
        if (!text.trim()) {
            throw new BadRequestException('Chapter has no content');
        }

        // 4. Detect Language/Defaults
        const detected = LanguageDetectorService.detect(text);
        const {
            voice = detected.voice,
            speed = 1.0,
            language = detected.code,
            format = 'mp3',
            forceRegenerate = false
        } = options;

        // 5. Check Cache
        if (!forceRegenerate) {
            const existing = await this.ttsRepository.findExisting(chapterId, language, voice);
            if (existing) {
                // Sync ttsStatus back to chapter document (may have been missing before)
                await this.chapterRepository.updateTtsStatus(chapterId, 'completed', existing.audioUrl);
                return existing;
            }
        }

        // 6. Create Pending Record
        const tts = TextToSpeech.create({
            id: this.idGenerator.generate(),
            chapterId,
            bookId: chapter.bookId.toString(),
            text,
            voice,
            language,
            speed,
            status: TTSStatus.PENDING,
            characterCount: text.length,
            paragraphCount: chapter.paragraphs.length,
        });

        const savedTTS = await this.ttsRepository.save(tts);

        try {
            // 7. Update to Processing
            await this.ttsRepository.updateStatus(savedTTS.id!, TTSStatus.PROCESSING);
            await this.chapterRepository.updateTtsStatus(chapterId, 'processing');

            // 8. Generate Audio
            const { audioUrl, duration } = await this.ttsProvider.generateAudio(text, {
                voice,
                language,
                speed,
                format
            });

            // 9. Update Success
            savedTTS.complete(audioUrl, format, duration);
            await this.ttsRepository.save(savedTTS);
            // Also update the chapter document with ttsStatus and audioUrl
            await this.chapterRepository.updateTtsStatus(chapterId, 'completed', audioUrl);

            return savedTTS;
        } catch (error) {
            // 10. Update Failure
            savedTTS.fail(error.message);
            await this.ttsRepository.save(savedTTS);
            await this.chapterRepository.updateTtsStatus(chapterId, 'failed');
            throw new InternalServerErrorException(`Failed to generate audio: ${error.message}`);
        }
    }
}

