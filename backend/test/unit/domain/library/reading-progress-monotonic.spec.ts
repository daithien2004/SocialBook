import {
  ReadingProgress,
  ChapterStatus,
} from '@/modules/library/domain/library/entities/reading-progress.entity';

describe('ReadingProgress Monotonic & Units (T7)', () => {
  it('creates an initially complete progress as COMPLETED', () => {
    const progress = ReadingProgress.create({
      id: 'rp-initially-completed',
      userId: '507f1f77bcf86cd799439011',
      bookId: '507f1f77bcf86cd799439012',
      chapterId: '507f1f77bcf86cd799439013',
      progress: 100,
    });

    expect(progress.progress).toBe(100);
    expect(progress.status).toBe(ChapterStatus.COMPLETED);
  });

  it('updates progress in 0..100 range and marks COMPLETED at 100', () => {
    const progress = ReadingProgress.create({
      id: 'rp-1',
      userId: '507f1f77bcf86cd799439011',
      bookId: '507f1f77bcf86cd799439012',
      chapterId: '507f1f77bcf86cd799439013',
    });

    progress.updateProgress(85);
    expect(progress.progress).toBe(85);
    expect(progress.status).toBe(ChapterStatus.READING);

    progress.updateProgress(100);
    expect(progress.progress).toBe(100);
    expect(progress.status).toBe(ChapterStatus.COMPLETED);
  });

  it('enforces monotonic progress when opts.monotonic=true (does not decrease on scroll up)', () => {
    const progress = ReadingProgress.create({
      id: 'rp-2',
      userId: '507f1f77bcf86cd799439011',
      bookId: '507f1f77bcf86cd799439012',
      chapterId: '507f1f77bcf86cd799439013',
    });

    progress.updateProgress(60, { monotonic: true });
    expect(progress.progress).toBe(60);

    // Scroll up to 20%
    progress.updateProgress(20, { monotonic: true });
    expect(progress.progress).toBe(60); // Must remain at 60

    // Scroll down to 80%
    progress.updateProgress(80, { monotonic: true });
    expect(progress.progress).toBe(80);
  });

  it('never downgrades COMPLETED chapter to READING via monotonic heartbeat update', () => {
    const progress = ReadingProgress.create({
      id: 'rp-3',
      userId: '507f1f77bcf86cd799439011',
      bookId: '507f1f77bcf86cd799439012',
      chapterId: '507f1f77bcf86cd799439013',
    });

    progress.markAsCompleted();
    expect(progress.status).toBe(ChapterStatus.COMPLETED);
    expect(progress.progress).toBe(100);

    // A heartbeat comes in with 10% progress
    progress.updateProgress(10, { monotonic: true });
    expect(progress.progress).toBe(100);
    expect(progress.status).toBe(ChapterStatus.COMPLETED);
  });
});
