export const ROOM_ID_PATTERN = /^[A-Za-z0-9]{6,10}$/;

export const HIGHLIGHT_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const OBJECT_ID_PATTERN = /^[0-9a-f]{24}$/i;

export const isObjectId = (value: unknown): value is string =>
  typeof value === 'string' && OBJECT_ID_PATTERN.test(value);

export const ROOM_ID_MIN_LENGTH = 6;
export const ROOM_ID_MAX_LENGTH = 10;

export const HIGHLIGHT_CONTENT_MIN_LENGTH = 1;
export const HIGHLIGHT_CONTENT_MAX_LENGTH = 1000;

export const CHAPTER_SLUG_MAX_LENGTH = 200;

export const PARAGRAPH_ID_MAX_LENGTH = 100;

export const CLIENT_DISPLAY_NAME_MAX_LENGTH = 80;
export const CLIENT_AVATAR_URL_MAX_LENGTH = 500;

export const PROGRESS_MIN = 0;
export const PROGRESS_MAX = 100;

export const CLIENT_MUTATION_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

export const IGNORED_FIELD_MAX_LENGTH = 64;

export const WS_MAX_HTTP_BUFFER_SIZE = 100 * 1024;

export const WS_CONNECT_TIMEOUT_MS = 10_000;

export const WS_PING_INTERVAL_MS = 25_000;

export const WS_PING_TIMEOUT_MS = 20_000;

export const WS_TRANSPORTS: readonly string[] = ['websocket'];

export const TOKEN_REVOCATION_TTL_SECONDS = 7 * 24 * 3600;

export interface ReadingRoomRuntimeConfig {
  presencePerSocket: boolean;
  connectionLimiterRedis: boolean;
  sessionExpiryDisconnect: boolean;
  ackContractV2: boolean;
  insightQueue: boolean;
  snapshotLimit: number;
}

export const MAX_CONNECTIONS_PER_USER = 5;

export const RATE_LIMIT_WINDOW_SECONDS = 60;

export const PRESENCE_BROADCAST_DEBOUNCE_MS = 3_000;

export const PROGRESS_FLUSH_DEBOUNCE_MS = 10_000;

export const PRESENCE_HASH_TTL_SECONDS = 90;

export const CONN_STALE_MS = 90_000;

export const PRESENCE_STALE_MS = 37_500;

export const INSIGHT_LOCK_TTL_SECONDS = 60;

export const IDEMPOTENCY_TTL_SECONDS = 300;

export const RATE_LIMIT_DEFAULTS = {
  add_highlight: 30,
  generate_highlight_insight: 5,
  join_room: 10,
  heartbeat: 90,
  remove_highlight: 30,
  chapter_change: 30,
  change_mode: 10,
  leave_room: 20,
  end_room: 5,
  delete_room: 5,
} as const satisfies Record<string, number>;

export type RateLimitedEvent = keyof typeof RATE_LIMIT_DEFAULTS;
