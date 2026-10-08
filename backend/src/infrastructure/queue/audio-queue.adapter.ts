import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { IAudioQueuePort } from '@/modules/text-to-speech/application/public-api';
import { GenerateAudioJobPayload } from '@/modules/text-to-speech/application/public-api';

// Giới hạn tổng số job đang chờ trong queue — bảo vệ toàn hệ thống.
// TODO: Thêm per-user limit khi ITextToSpeechRepository có method countByUserAndStatus.
const MAX_GLOBAL_QUEUE_SIZE = 100;

@Injectable()
export class AudioQueueAdapter implements IAudioQueuePort {
  private readonly logger = new Logger(AudioQueueAdapter.name);

  constructor(
    @InjectQueue('audio-generation') private readonly audioQueue: Queue,
  ) {}

  async queueAudioGeneration(payload: GenerateAudioJobPayload): Promise<void> {
    // Global guard — bảo vệ toàn bộ hệ thống khỏi bị ngập job.
    const counts = await this.audioQueue.getJobCounts('waiting', 'delayed');
    if (counts.waiting + counts.delayed >= MAX_GLOBAL_QUEUE_SIZE) {
      throw new ServiceUnavailableException(
        'Hệ thống tạo audio đang quá tải, vui lòng thử lại sau.',
      );
    }

    try {
      await this.audioQueue.add('generate.audio', payload, {
        // jobId tất định — BullMQ từ chối job trùng nếu user bấm 2 lần liên tiếp.
        jobId: `tts-${payload.ttsRecordId}`,
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: true,
        removeOnFail: 100,
      });
      this.logger.debug(
        `Queued generate.audio job for chapter ${payload.chapterId}`,
      );
    } catch (error) {
      this.logger.error('Failed to queue generate.audio job', error);
      throw error;
    }
  }
}
