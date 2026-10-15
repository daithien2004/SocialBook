import { Injectable } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { getErrorMessage } from '@/shared/platform/utils/error.util';
import {
  BadRequestDomainException,
  InternalServerDomainException,
  NotFoundDomainException,
} from '@/shared/domain/common-exceptions';
import { TextToSpeechRepository } from '@/modules/text-to-speech/domain/repositories/text-to-speech.repository';
import { AudioQueuePort } from '@/modules/text-to-speech/application/audio-queue.port';
import { GenerateAudioJobPayload } from '@/modules/text-to-speech/application/jobs/tts-job.payload';
import { LanguageDetectorService } from '@/modules/text-to-speech/application/services/language-detector.service';
import {
  GetChapterAudioSourceQuery,
  UpdateChapterAudioStatusCommand,
} from '@/modules/chapters';
import {
  TextToSpeech,
  TTSStatus,
} from '@/modules/text-to-speech/domain/entities/text-to-speech.entity';
import { IIdGenerator } from '@/shared/domain/id-generator.interface';
import { GenerateChapterAudioCommand } from '../commands/generate-chapter-audio/generate-chapter-audio.command';

@Injectable()
export class ChapterAudioGenerationService {
  constructor(
    private readonly ttsRepository: TextToSpeechRepository,
    private readonly audioQueue: AudioQueuePort,
    private readonly languageDetector: LanguageDetectorService,
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly idGenerator: IIdGenerator,
  ) {}

  async execute(command: GenerateChapterAudioCommand): Promise<TextToSpeech> {
    const chapter = await this.queryBus.execute(
      new GetChapterAudioSourceQuery(command.actor, command.chapterId),
    );
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
    const language = command.language ?? detected.code;
    const speed = command.speed ?? 1;
    const format = command.format ?? 'mp3';

    if (!command.forceRegenerate) {
      const existing = await this.ttsRepository.findExisting(
        command.chapterId,
        language,
        voice,
        speed,
        format,
      );
      if (existing) {
        await this.commandBus.execute(
          new UpdateChapterAudioStatusCommand(
            command.actor,
            command.chapterId,
            'completed',
            existing.audioUrl,
          ),
        );
        return existing;
      }
    }

    const tts = TextToSpeech.create({
      id: this.idGenerator.generate(),
      chapterId: command.chapterId,
      bookId: chapter.bookId,
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
          command.chapterId,
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
      await this.commandBus.execute(
        new UpdateChapterAudioStatusCommand(
          command.actor,
          command.chapterId,
          'failed',
        ),
      );
      throw new InternalServerDomainException(
        `Failed to queue audio generation: ${errorMessage}`,
      );
    }
  }
}
