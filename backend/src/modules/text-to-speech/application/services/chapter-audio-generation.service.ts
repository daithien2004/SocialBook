import { Inject, Injectable } from '@nestjs/common';
import { getErrorMessage } from '@/shared/platform/utils/error.util';
import {
  BadRequestDomainException,
  InternalServerDomainException,
  NotFoundDomainException,
} from '@/shared/domain/common-exceptions';
import { ITextToSpeechRepository } from '@/modules/text-to-speech/domain/repositories/text-to-speech.repository.interface';
import { IAudioQueuePort } from '@/modules/text-to-speech/application/audio-queue.port';
import { GenerateAudioJobPayload } from '@/modules/text-to-speech/application/jobs/tts-job.payload';
import { LanguageDetectorService } from '@/modules/text-to-speech/application/services/language-detector.service';
import { IChapterRepository } from '@/modules/chapters/domain/public-api';
import {
  TextToSpeech,
  TTSStatus,
} from '@/modules/text-to-speech/domain/entities/text-to-speech.entity';
import { IIdGenerator } from '@/shared/domain/id-generator.interface';
import { ChapterId } from '@/modules/chapters/domain/public-api';
import { GenerateChapterAudioCommand } from '../commands/generate-chapter-audio/generate-chapter-audio.command';

@Injectable()
export class ChapterAudioGenerationService {
  constructor(
    private readonly ttsRepository: ITextToSpeechRepository,
    @Inject(IAudioQueuePort)
    private readonly audioQueue: IAudioQueuePort,
    private readonly languageDetector: LanguageDetectorService,
    private readonly chapterRepository: IChapterRepository,
    private readonly idGenerator: IIdGenerator,
  ) {}

  async execute(command: GenerateChapterAudioCommand): Promise<TextToSpeech> {
    const chapterId = ChapterId.create(command.chapterId);
    const chapter = await this.chapterRepository.findById(chapterId);
    if (!chapter) {
      throw new NotFoundDomainException('Chapter not found');
    }

    const text = chapter.paragraphs
      .map((paragraph) => paragraph.content)
      .join('\n\n');
    if (!text.trim()) {
      throw new BadRequestDomainException('Chapter has no content');
    }

    const detected = this.languageDetector.detect(text);
    const voice = command.voice ?? detected.voice;
    const speed = 1;
    const language = detected.code;
    const format = 'mp3';

    if (!command.forceRegenerate) {
      const existing = await this.ttsRepository.findExisting(
        chapterId.toString(),
        language,
        voice,
      );
      if (existing) {
        await this.chapterRepository.updateTtsStatus(
          chapterId.toString(),
          'completed',
          existing.audioUrl,
        );
        return existing;
      }
    }

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
    const savedTts = await this.ttsRepository.save(tts);

    try {
      await this.audioQueue.queueAudioGeneration(
        new GenerateAudioJobPayload(
          savedTts.id,
          chapterId.toString(),
          voice,
          language,
          speed,
          format,
        ),
      );
      return savedTts;
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      savedTts.fail(errorMessage);
      await this.ttsRepository.save(savedTts);
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
