export const ROOM_ID_PATTERN = /^[A-Za-z0-9]{6,10}$/;

export const HIGHLIGHT_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const OBJECT_ID_PATTERN = /^[0-9a-f]{24}$/i;

export const isObjectId = (value: unknown): value is string =>
  typeof value === 'string' && OBJECT_ID_PATTERN.test(value);

export const HIGHLIGHT_CONTENT_MIN_LENGTH = 1;
export const HIGHLIGHT_CONTENT_MAX_LENGTH = 1000;

export const CHAPTER_SLUG_MAX_LENGTH = 200;

export const PARAGRAPH_ID_MAX_LENGTH = 100;

export const PROGRESS_MIN = 0;
export const PROGRESS_MAX = 100;

export const WS_MAX_HTTP_BUFFER_SIZE = 100 * 1024;

export const WS_CONNECT_TIMEOUT_MS = 10_000;

export const WS_PING_INTERVAL_MS = 25_000;

export const WS_PING_TIMEOUT_MS = 20_000;

export const WS_TRANSPORTS: readonly string[] = ['websocket'];

export const TOKEN_REVOCATION_TTL_SECONDS = 7 * 24 * 3600;

export const MAX_CONNECTIONS_PER_USER = 5;

export const RATE_LIMIT_WINDOW_SECONDS = 60;

export const PRESENCE_BROADCAST_DEBOUNCE_MS = 3_000;

export const PROGRESS_FLUSH_INTERVAL_MS = 10_000;

export const PRESENCE_HASH_TTL_SECONDS = 90;

export const CONN_STALE_MS = 90_000;
