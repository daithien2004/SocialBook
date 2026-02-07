import { Injectable, BadRequestException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { ITextToSpeechRepository } from '../../domain/repositories/text-to-speech.repository.interface';
import { ITextToSpeechProvider } from '../../domain/interfaces/text-to-speech.provider.interface';
import { IChapterRepository } from '@/src/modules/chapters/domain/repositories/chapter.repository.interface';
import { TextToSpeech, TTSStatus } from '../../domain/entities/text-to-speech.entity';
import { LanguageDetectorService } from '../../domain/services/language-detector.service';
import { Types } from 'mongoose';

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
    ) {}

    async execute(chapterId: string, options: GenerateAudioOptions = {}): Promise<any> {
        // 1. Validation
        if (!Types.ObjectId.isValid(chapterId)) {
            throw new BadRequestException('Invalid chapter ID');
        }

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
                return existing; // Return entity, mapper will handle presentation
            }
        }

        // 6. Create Pending Record
        const tts = TextToSpeech.create({
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
            // savedTTS.props.status = TTSStatus.PROCESSING; // Direct update or via method?
            // Usually we might just update DB state directly if entity doesn't track change sets deeply
            await this.ttsRepository.updateStatus(savedTTS.id!, TTSStatus.PROCESSING);

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

            return savedTTS;
        } catch (error) {
            // 10. Update Failure
            savedTTS.fail(error.message);
            await this.ttsRepository.save(savedTTS);
            throw new InternalServerErrorException(`Failed to generate audio: ${error.message}`);
        }
    }
}
