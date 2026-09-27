/**
 * Vai trò của tiến trình hiện tại.
 *
 * API và worker dùng chung một image, chỉ khác entry point (`main.ts` vs `worker.ts`).
 * Worker đặt `WORKER_MODE=true` trước khi nạp AppModule, nhờ đó các BullMQ consumer
 * nặng chỉ được đăng ký ở đúng một tiến trình thay vì mọi replica API.
 */
export const isWorkerProcess = (): boolean =>
  process.env.WORKER_MODE === 'true';
