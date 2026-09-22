import { getSession } from 'next-auth/react';
import type { Session } from 'next-auth';

const SESSION_LOCK_NAME = 'sb:session-refresh';

// Single-flight cấp module: mọi caller trong cùng tab chia sẻ đúng 1 promise.
// (Thay cho các mutex cục bộ từng file — trước đây không cover được nhiều nguồn gọi.)
let inFlight: Promise<Session | null> | null = null;

async function fetchSessionSingleFlight(): Promise<Session | null> {
  if (!inFlight) {
    inFlight = getSession().finally(() => {
      inFlight = null;
    });
  }
  return inFlight;
}

/** Điểm duy nhất gọi getSession() ở client. */
export async function getSessionSingleton(): Promise<Session | null> {
  if (typeof navigator !== 'undefined' && 'locks' in navigator) {
    return navigator.locks.request(SESSION_LOCK_NAME, fetchSessionSingleFlight);
  }
  return fetchSessionSingleFlight();
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Đọc session, retry tối đa `maxAttempts` lần tới khi có role.
 * Tránh delay cố định sau signIn — dừng ngay khi cookie đã hiệu lực.
 */
export async function waitForSessionRole(options?: {
  maxAttempts?: number;
  backoffMs?: number;
}): Promise<Session | null> {
  const maxAttempts = options?.maxAttempts ?? 3;
  const backoffMs = options?.backoffMs ?? 150;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const session = await getSessionSingleton();
    if (session?.user?.role) {
      if (attempt > 0) {
        console.warn(
          `[session] stale on first read, resolved on attempt ${attempt + 1} for user=${session.user.id ?? 'unknown'}`,
        );
      }
      return session;
    }
    if (attempt < maxAttempts - 1) {
      await delay(backoffMs);
    }
  }
  return null;
}