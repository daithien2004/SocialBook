import { Injectable, Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { ITextToSpeechRepository } from '@/domain/text-to-speech/repositories/text-to-speech.repository.interface';
import { ITextToSpeechPort } from '@/domain/text-to-speech/interfaces/text-to-speech.port';
import { IChapterRepository } from '@/domain/chapters/repositories/chapter.repository.interface';
import { TTSStatus } from '@/domain/text-to-speech/entities/text-to-speech.entity';
import { getErrorMessage } from '@/common/utils/error.util';
import { ChapterId } from '@/domain/chapters/value-objects/chapter-id.vo';
import { GenerateAudioJobPayload } from '@/application/text-to-speech/jobs/tts-job.payload';

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
    private readonly ttsRepository: ITextToSpeechRepository,
    private readonly ttsProvider: ITextToSpeechPort,
    private readonly chapterRepository: IChapterRepository,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    this.logger.log(`Processing audio generation job ${job.id}`);

    try {
      switch (job.name) {
        case 'generate.audio':
          await this.handleGenerateAudio(job.data as GenerateAudioJobPayload);
          break;
        default:
          this.logger.warn(`Unknown job name: ${job.name}`);
      }
    } catch (error) {
      this.logger.error(
        `Error processing audio generation job ${job.id}`,
        error,
      );
      throw error; // Let BullMQ handle retries
    }
  }

  private async handleGenerateAudio(payload: GenerateAudioJobPayload) {
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
      await this.chapterRepository.updateTtsStatus(
        payload.chapterId,
        'processing',
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

        const chapter = await this.chapterRepository.findById(
          ChapterId.create(payload.chapterId),
        );
        if (!chapter) {
          throw new Error(`Chapter ${payload.chapterId} not found`);
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

      await this.chapterRepository.updateTtsStatus(
        payload.chapterId,
        'completed',
        audioUrl,
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
      await this.chapterRepository.updateTtsStatus(payload.chapterId, 'failed');

      throw error; // Rethrow to let BullMQ retry or mark as failed
    }
  }
}
