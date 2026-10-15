import { Injectable, Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job, UnrecoverableError } from 'bullmq';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { TextToSpeechRepository } from '@/modules/text-to-speech/domain/repositories/text-to-speech.repository';
import { TextToSpeechProvider } from '@/modules/text-to-speech/domain/ports/text-to-speech.provider';
import { AbilityFactory } from '@/shared/casl/ability.factory';
import {
  GetChapterAudioSourceQuery,
  UpdateChapterAudioStatusCommand,
} from '@/modules/chapters';
import { TTSStatus } from '@/modules/text-to-speech/domain/entities/text-to-speech.entity';
import { getErrorMessage } from '@/shared/platform/utils/error.util';
import {
  GenerateAudioJobPayload,
  GenerateAudioJobPayloadSchema,
} from '@/modules/text-to-speech/application/public-api';

@Processor('audio-generation', {
  concurrency: 2,
  // limiter: Dù concurrency cho phép 2 job song song, vẫn giới hạn tối đa
  // 10 lần gọi TTS provider / phút để không bị ban do rate-limit.
  limiter: { max: 10, duration: 60_000 },
})
@Injectable()
export class AudioWorker extends WorkerHost {
  private readonly logger = new Logger(AudioWorker.name);

  constructor(
    private readonly ttsRepository: TextToSpeechRepository,
    private readonly ttsProvider: TextToSpeechProvider,
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly abilityFactory: AbilityFactory,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    this.logger.log(`Processing audio generation job ${job.id ?? 'unknown'}`);

    try {
      switch (job.name) {
        case 'generate.audio':
          {
            const parsed = GenerateAudioJobPayloadSchema.safeParse(job.data);
            if (!parsed.success) {
              throw new UnrecoverableError(
                `Invalid generate.audio payload: ${parsed.error.message}`,
              );
            }
            await this.handleGenerateAudio(parsed.data);
          }
          break;
        default:
          this.logger.warn(`Unknown job name: ${job.name}`);
      }
    } catch (error) {
      this.logger.error(
        `Error processing audio generation job ${job.id ?? 'unknown'}`,
        error,
      );
      throw error; // Let BullMQ handle retries
    }
  }

  private async handleGenerateAudio(payload: GenerateAudioJobPayload) {
    const actor = this.abilityFactory.createActor({
      userId: 'system:text-to-speech',
      roles: ['admin'],
    });
    // 1. Fetch TTS Record
    const ttsRecord = await this.ttsRepository.findById(payload.ttsRecordId);

    if (!ttsRecord) {
      this.logger.warn(
        `TTS Record ${payload.ttsRecordId} not found, skipping job.`,
      );
      return;
    }

    // Idempotency check: if already completed, don't generate again
    if (ttsRecord.status === TTSStatus.COMPLETED) {
      this.logger.warn(
        `TTS Record ${payload.ttsRecordId} already completed, skipping job.`,
      );
      return;
    }

    try {
      // 2. Update status to PROCESSING
      await this.ttsRepository.updateStatus(ttsRecord.id, TTSStatus.PROCESSING);
      await this.commandBus.execute(
        new UpdateChapterAudioStatusCommand(
          actor,
          payload.chapterId,
          'processing',
        ),
      );

      const existingAudioUrl = ttsRecord.audioUrl;
      let audioUrl: string;
      let duration: number | undefined;

      if (existingAudioUrl) {
        audioUrl = existingAudioUrl;
        duration = ttsRecord.audioDuration;
        this.logger.warn(
          `Audio already generated for chapter ${payload.chapterId}, resuming finalization without re-billing the provider.`,
        );
      } else {
        this.logger.log(
          `Generating audio for chapter ${payload.chapterId} using voice ${payload.voice}`,
        );

        const chapter = await this.queryBus.execute(
          new GetChapterAudioSourceQuery(actor, payload.chapterId),
        );
        if (!chapter) {
          throw new UnrecoverableError(
            `Chapter ${payload.chapterId} not found`,
          );
        }

        const text = chapter.paragraphs.map((p) => p.content).join('\n\n');

        const generated = await this.ttsProvider.generateAudio(text, {
          voice: payload.voice,
          language: payload.language,
          speed: payload.speed,
          format: payload.format,
        });

        audioUrl = generated.audioUrl;
        duration = generated.duration;

        ttsRecord.markGenerated(audioUrl, payload.format, duration);
        await this.ttsRepository.save(ttsRecord);
      }

      // 4. Update Success
      ttsRecord.complete(audioUrl, payload.format, duration);
      await this.ttsRepository.save(ttsRecord);

      await this.commandBus.execute(
        new UpdateChapterAudioStatusCommand(
          actor,
          payload.chapterId,
          'completed',
          audioUrl,
        ),
      );

      this.logger.log(
        `Successfully generated audio for chapter ${payload.chapterId}`,
      );
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error);
      this.logger.error(
        `Failed to generate audio for chapter ${payload.chapterId}: ${errorMessage}`,
      );

      ttsRecord.fail(errorMessage);
      await this.ttsRepository.save(ttsRecord);
      await this.commandBus.execute(
        new UpdateChapterAudioStatusCommand(actor, payload.chapterId, 'failed'),
      );

      throw error; // Rethrow to let BullMQ retry or mark as failed
    }
  }
}
