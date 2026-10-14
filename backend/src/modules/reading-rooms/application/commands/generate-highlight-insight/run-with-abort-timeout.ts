export async function runWithAbortTimeout<T>(
  operation: (signal: AbortSignal) => Promise<T>,
  timeoutMs: number,
): Promise<T> {
  const controller = new AbortController();
  let timeoutId: NodeJS.Timeout | undefined;
  const timeoutError = new Error(
    `Operation timed out after ${timeoutMs.toString()}ms`,
  );
  const request = operation(controller.signal);
  const timeout = new Promise<never>((_resolve, reject) => {
    timeoutId = setTimeout(() => {
      controller.abort();
      reject(timeoutError);
    }, timeoutMs);
  });

  try {
    return await Promise.race([request, timeout]);
  } catch (error: unknown) {
    if (controller.signal.aborted) throw timeoutError;
    throw error;
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}
