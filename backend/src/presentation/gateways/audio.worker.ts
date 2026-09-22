import { Injectable, Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { ITextToSpeechRepository } from '@/domain/text-to-speech/repositories/text-to-speech.repository.interface';
import { ITextToSpeechPort } from '@/domain/text-to-speech/interfaces/text-to-speech.port';
import { IChapterRepository } from '@/domain/chapters/repositories/chapter.repository.interface';
import { TTSStatus } from '@/domain/text-to-speech/entities/text-to-speech.entity';
import { getErrorMessage } from '@/common/utils/error.util';
import { GenerateAudioJobPayload } from '@/application/text-to-speech/jobs/tts-job.payload';

@Processor('audio-generation', {
  concurrency: 2, // Limit concurrency to prevent rate-limiting from TTS Provider
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

      this.logger.log(
        `Generating audio for chapter ${payload.chapterId} using voice ${payload.voice}`,
      );

      // 3. Generate Audio
      const { audioUrl, duration } = await this.ttsProvider.generateAudio(
        payload.text,
        {
          voice: payload.voice,
          language: payload.language,
          speed: payload.speed,
          format: payload.format,
        },
      );

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
