/**
 * Bộ type guard dùng chung — xem .agents/skills/nestjs-type-safety-boundaries.
 *
 * Mọi dữ liệu đi qua ranh giới process (HTTP, WS, Redis, JWT, JSON, env, job)
 * là `unknown` cho đến khi được xác thực bằng guard trong file này (hoặc DTO
 * + ValidationPipe). Không dùng cast để "qua cửa".
 */

export const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

export const isNonEmptyString = (v: unknown): v is string =>
  typeof v === 'string' && v.length > 0;

export const hasStringProp = <K extends string>(
  v: unknown,
  key: K,
): v is Record<K, string> => isRecord(v) && typeof v[key] === 'string';

/** `isOneOf(['a','b'])` trả guard `v is 'a' | 'b'`. */
export const isOneOf =
  <const T extends readonly string[]>(values: T) =>
  (v: unknown): v is T[number] =>
    typeof v === 'string' && values.some((x) => x === v);

export const isArrayOf =
  <T>(guard: (v: unknown) => v is T) =>
  (v: unknown): v is T[] =>
    Array.isArray(v) && v.every(guard);

export const errorMessage = (e: unknown): string =>
  e instanceof Error ? e.message : String(e);

export const errorStack = (e: unknown): string | undefined =>
  e instanceof Error ? e.stack : undefined;

/**
 * Parse JSON an toàn: sai hình dạng → `null`, không đoán, không cast.
 * Đặt guard ở nơi gọi để ràng buộc đúng shape.
 */
export const readJson = <T>(
  raw: string | null,
  guard: (v: unknown) => v is T,
): T | null => {
  if (raw === null) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  return guard(parsed) ? parsed : null;
};
