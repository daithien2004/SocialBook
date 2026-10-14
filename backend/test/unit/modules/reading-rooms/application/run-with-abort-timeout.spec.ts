import { runWithAbortTimeout } from '@/modules/reading-rooms/application/commands/generate-highlight-insight/run-with-abort-timeout';

describe('runWithAbortTimeout', () => {
  it('rejects at the deadline and aborts an operation that ignores the signal', async () => {
    let receivedSignal: AbortSignal | undefined;
    const operation = jest.fn((signal: AbortSignal) => {
      receivedSignal = signal;
      return new Promise<string>(() => undefined);
    });

    await expect(runWithAbortTimeout(operation, 5)).rejects.toThrow(
      'Operation timed out after 5ms',
    );

    expect(receivedSignal?.aborted).toBe(true);
  });

  it('returns the operation result when it finishes before the deadline', async () => {
    const operation = jest.fn(() => Promise.resolve('insight'));

    await expect(runWithAbortTimeout(operation, 5_000)).resolves.toBe(
      'insight',
    );
    expect(operation).toHaveBeenCalledTimes(1);
  });
});
