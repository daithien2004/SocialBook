import type { JobsOptions } from 'bullmq';

/**
 * Cau hinh job mac dinh dung chung cho moi queue chua co defaultJobOptions.
 *
 * - attempts: 3       -> Thu lai 3 lan khi gap loi transient (mang chap chon, DB tam thoi ban).
 * - backoff exponential -> Lan 1 cho 3s, lan 2 cho 6s, lan 3 cho 12s.
 * - removeOnComplete  -> Chi giu toi da 1000 job da xong trong vong 1 gio.
 * - removeOnFail      -> Giu lai job that bai 7 ngay de debug.
 */
export const DEFAULT_JOB_OPTIONS: JobsOptions = {
  attempts: 3,
  backoff: { type: 'exponential', delay: 3000 },
  removeOnComplete: { age: 3600, count: 1000 },
  removeOnFail: { age: 7 * 86400, count: 1000 },
};
