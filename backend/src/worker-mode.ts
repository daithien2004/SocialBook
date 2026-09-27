/**
 * Phải được import TRƯỚC `./app.module` trong `worker.ts`.
 *
 * Các module gọi `isWorkerProcess()` ngay lúc trang trí `@Module`, tức ngay lúc
 * import — nên biến môi trường phải có trước khi AppModule được nạp.
 */
process.env.WORKER_MODE = 'true';

export {};
