import type { Job, Queue } from 'bullmq';

import { AudioWorker } from '@/presentation/gateways/audio.worker';
import {
  POST_MODERATION_JOB,
  PostModerationProcessor,
  type PostModerationJobData,
} from '@/infrastructure/queues/post-moderation/post-moderation.processor';
import { ChaptersImportProcessor } from '@/infrastructure/queues/chapters-import/chapters-import.processor';
import { GenerateAudioJobPayload } from '@/application/text-to-speech/jobs/tts-job.payload';
import { TTSStatus } from '@/domain/text-to-speech/entities/text-to-speech.entity';
import type { ImportChaptersJobData } from '@/domain/chapters/interfaces/chapters-import.types';
import type { CreateSingleChapterJobData } from '@/application/chapters/processors/single-chapter.processor';
import type { ITextToSpeechRepository } from '@/domain/text-to-speech/repositories/text-to-speech.repository.interface';
import type { ITextToSpeechPort } from '@/domain/text-to-speech/interfaces/text-to-speech.port';
import type { IChapterRepository } from '@/domain/chapters/repositories/chapter.repository.interface';
import type { ProcessPostModerationUseCase } from '@/application/posts/use-cases/process-post-moderation.use-case';

/**
 * Regression test cho A1–A3 của docs/ecommerce_production_standard.md §11.
 *
 * Ba bất biến này đều là loại lỗi im lặng — không có test thì xoá nhầm config
 * cũng không ai biết cho tới khi job biến mất hoặc tiền TTS bị tính 2 lần.
 */

interface TtsRecordStub {
  id: string;
  status: TTSStatus;
  audioUrl?: string;
  audioDuration?: number;
  markGenerated: jest.Mock;
  complete: jest.Mock;
  fail: jest.Mock;
}

/** Ghi lại thứ tự gọi để khẳng định quan hệ "trước/sau" giữa các bước ghi. */
type CallLog = string[];

const makeTtsRecord = (
  calls: CallLog,
  overrides: Partial<TtsRecordStub> = {},
): TtsRecordStub => ({
  id: 'tts-1',
  status: TTSStatus.PENDING,
  markGenerated: jest.fn((url: string) => {
    calls.push(`tts.markGenerated:${url}`);
  }),
  complete: jest.fn(() => {
    calls.push('tts.complete');
  }),
  fail: jest.fn(() => {
    calls.push('tts.fail');
  }),
  ...overrides,
});

const makeAudioWorker = (ttsRecord: TtsRecordStub, calls: CallLog) => {
  const ttsRepository = {
    findById: jest.fn(() => Promise.resolve(ttsRecord)),
    updateStatus: jest.fn(() => {
      calls.push('tts.updateStatus');
      return Promise.resolve();
    }),
    save: jest.fn(() => {
      calls.push('tts.save');
      return Promise.resolve(ttsRecord);
    }),
  };

  const ttsProvider = {
    generateAudio: jest.fn(() => {
      calls.push('provider.generateAudio');
      return Promise.resolve({
        audioUrl: 'https://cdn/new.mp3',
        format: 'mp3',
        duration: 42,
      });
    }),
  };

  const chapterRepository = {
    updateTtsStatus: jest.fn((_id: string, status: string) => {
      calls.push(`chapter.update:${status}`);
      return Promise.resolve();
    }),
  };

  const worker = new AudioWorker(
    ttsRepository as unknown as ITextToSpeechRepository,
    ttsProvider,
    chapterRepository as unknown as IChapterRepository,
  );

  return { worker, ttsProvider, chapterRepository };
};

const audioJob = (): Job =>
  ({
    id: 'job-1',
    name: 'generate.audio',
    data: new GenerateAudioJobPayload(
      'tts-1',
      'ch-1',
      'Nội dung chương.',
      'vi-VN-Standard-A',
      'vi',
      1,
      'mp3',
    ),
  }) as unknown as Job;

describe('A2 — audioUrl phải bền vững TRƯỚC khi chapter trỏ tới nó', () => {
  it('lưu audioUrl vào TTS record trước khi cập nhật chapter', async () => {
    const calls: CallLog = [];
    const ttsRecord = makeTtsRecord(calls);
    const { worker } = makeAudioWorker(ttsRecord, calls);

    await worker.process(audioJob());

    // Thứ tự này là toàn bộ nội dung của A2: provider đã tính tiền ngay khi
    // generateAudio trả về, nên URL phải được ghi xuống trước khi chapter
    // tham chiếu tới nó. Đảo lại thì một cú crash ở bước chapter sẽ làm mất
    // URL của đoạn audio đã trả tiền.
    expect(calls.indexOf('tts.markGenerated:https://cdn/new.mp3')).toBeLessThan(
      calls.indexOf('tts.save'),
    );
    expect(calls.indexOf('tts.save')).toBeLessThan(
      calls.indexOf('chapter.update:completed'),
    );
  });

  it('không gọi lại provider khi TTS record đã có audioUrl (không tính phí 2 lần)', async () => {
    const calls: CallLog = [];
    const ttsRecord = makeTtsRecord(calls, {
      audioUrl: 'https://cdn/existing.mp3',
      audioDuration: 30,
    });
    const { worker, ttsProvider, chapterRepository } = makeAudioWorker(
      ttsRecord,
      calls,
    );

    await worker.process(audioJob());

    expect(ttsProvider.generateAudio).not.toHaveBeenCalled();
    expect(chapterRepository.updateTtsStatus).toHaveBeenCalledWith(
      'ch-1',
      'completed',
      'https://cdn/existing.mp3',
    );
  });
});

describe('A3 — moderation thất bại thì giữ PENDING cho Admin, không throw', () => {
  const moderationJob = (): Job<PostModerationJobData> =>
    ({
      id: 'job-1',
      name: POST_MODERATION_JOB,
      data: { postId: 'post-1', content: 'nội dung' },
    }) as unknown as Job<PostModerationJobData>;

  const buildProcessor = (execute: jest.Mock) =>
    new PostModerationProcessor({
      execute,
    } as unknown as ProcessPostModerationUseCase);

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('thử lại 3 lần rồi bỏ qua mà KHÔNG ném lỗi', async () => {
    const execute = jest.fn().mockRejectedValue(new Error('AI provider down'));
    const processor = buildProcessor(execute);

    const pending = processor.process(moderationJob());
    await jest.advanceTimersByTimeAsync(20_000);

    // Ném lỗi ở đây sẽ khiến BullMQ đánh dấu job failed và bài viết kẹt ở
    // trạng thái không ai kiểm duyệt. Bỏ qua + log mới đẩy được sang Admin.
    await expect(pending).resolves.toBeUndefined();
    expect(execute).toHaveBeenCalledTimes(3);
  });

  it('thành công ở lần thử thứ hai thì dừng, không thử thêm', async () => {
    const execute = jest
      .fn()
      .mockRejectedValueOnce(new Error('transient'))
      .mockResolvedValueOnce(undefined);
    const processor = buildProcessor(execute);

    const pending = processor.process(moderationJob());
    await jest.advanceTimersByTimeAsync(20_000);

    await expect(pending).resolves.toBeUndefined();
    expect(execute).toHaveBeenCalledTimes(2);
  });
});

describe('A1 — job tạo chương con phải được enqueue kèm retry', () => {
  it('enqueue kèm attempts + exponential backoff', async () => {
    const add = jest.fn((_name: string, _data: unknown, _options: unknown) =>
      Promise.resolve({ id: 'child-1' }),
    );

    const processor = new ChaptersImportProcessor({
      add,
    } as unknown as Queue<CreateSingleChapterJobData>);

    const job = {
      id: 'job-1',
      name: 'import-chapters',
      data: {
        bookId: 'book-1',
        chapters: [{ title: 'Chương 1', content: 'Câu một. Câu hai.' }],
      },
      updateProgress: jest.fn(() => Promise.resolve(undefined)),
    } as unknown as Job<ImportChaptersJobData>;

    await processor.process(job);

    // Không có retry thì một lần nghẽn mạng thoáng qua cũng đủ làm mất chương
    // khỏi sách đã import, mà job cha vẫn báo thành công.
    expect(add).toHaveBeenCalledTimes(1);
    expect(add.mock.calls[0][2]).toMatchObject({
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: true,
      removeOnFail: 100,
    });
  });
});
