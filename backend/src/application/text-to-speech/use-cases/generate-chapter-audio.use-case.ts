import { getErrorMessage } from '@/common/utils/error.util';
import { Injectable, Inject } from '@nestjs/common';
import {
  BadRequestDomainException,
  NotFoundDomainException,
  InternalServerDomainException,
} from '@/shared/domain/common-exceptions';
import { ITextToSpeechRepository } from '@/domain/text-to-speech/repositories/text-to-speech.repository.interface';
import { IAudioQueuePort } from '@/application/ports/audio-queue.port';
import { GenerateAudioJobPayload } from '@/application/text-to-speech/jobs/tts-job.payload';
import { LanguageDetectorService } from '@/application/text-to-speech/services/language-detector.service';
import { IChapterRepository } from '@/domain/chapters/repositories/chapter.repository.interface';
import {
  TextToSpeech,
  TTSStatus,
} from '@/domain/text-to-speech/entities/text-to-speech.entity';
import { IIdGenerator } from '@/shared/domain/id-generator.interface';

export interface GenerateAudioOptions {
  voice?: string;
  speed?: number;
  language?: string;
  format?: string;
  forceRegenerate?: boolean;
}

import { ChapterId } from '@/domain/chapters/value-objects/chapter-id.vo';

@Injectable()
export class GenerateChapterAudioUseCase {
  constructor(
    private readonly ttsRepository: ITextToSpeechRepository,
    @Inject(IAudioQueuePort)
    private readonly audioQueue: IAudioQueuePort,
    private readonly languageDetector: LanguageDetectorService,
    private readonly chapterRepository: IChapterRepository,
    private readonly idGenerator: IIdGenerator,
  ) {}

  async execute(
    chapterIdStr: string,
    options: GenerateAudioOptions = {},
  ): Promise<TextToSpeech> {
    // 1. Validation (Optional, can rely on repository or value objects)
    const chapterId = ChapterId.create(chapterIdStr);

    // 2. Get Chapter
    const chapter = await this.chapterRepository.findById(chapterId);
    if (!chapter) {
      throw new NotFoundDomainException('Chapter not found');
    }

    // 3. Prepare Text
    const text = chapter.paragraphs.map((p) => p.content).join('\n\n');
    if (!text.trim()) {
      throw new BadRequestDomainException('Chapter has no content');
    }

    // 4. Detect Language/Defaults
    const detected = this.languageDetector.detect(text);
    const {
      voice = detected.voice,
      speed = 1.0,
      language = detected.code,
      format = 'mp3',
      forceRegenerate = false,
    } = options;

    // 5. Check Cache
    if (!forceRegenerate) {
      const existing = await this.ttsRepository.findExisting(
        chapterId.toString(),
        language,
        voice,
      );
      if (existing) {
        // Sync ttsStatus back to chapter document (may have been missing before)
        await this.chapterRepository.updateTtsStatus(
          chapterId.toString(),
          'completed',
          existing.audioUrl,
        );
        return existing;
      }
    }

    // 6. Create Pending Record
    const tts = TextToSpeech.create({
      id: this.idGenerator.generate(),
      chapterId: chapterId.toString(),
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
      // 7. Queue Job
      await this.audioQueue.queueAudioGeneration(
        new GenerateAudioJobPayload(
          savedTTS.id,
          chapterId.toString(),
          text,
          voice,
          language,
          speed,
          format,
        ),
      );

      return savedTTS;
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      savedTTS.fail(errorMessage);
      await this.ttsRepository.save(savedTTS);
      await this.chapterRepository.updateTtsStatus(
        chapterId.toString(),
        'failed',
      );
      throw new InternalServerDomainException(
        `Failed to queue audio generation: ${errorMessage}`,
      );
    }
  }
}
