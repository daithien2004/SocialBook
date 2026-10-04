/**
 * Hằng số + hằng mẫu của namespace /reading-rooms.
 *
 * Quy tắc: mọi giới hạn, pattern và mã lỗi của gateway nằm ở đây thay vì rải
 * trong handler (yêu cầu mục 1.7 của kế hoạch hardening). Giá trị mặc định có
 * thể ghi đè qua `ConfigService` (xem `WS_*` trong `config/env.config.ts`).
 */

/* -------------------------------------------------------------------------- */
/* Patterns — phải khớp với VO/domain, không tự phát minh                       */
/* -------------------------------------------------------------------------- */

/**
 * Mã phòng (`roomId` / `roomCode`).
 *
 * Domain: `RoomId.isValid` → `/^[A-Z0-9]{6,10}$/` sau `trim().toUpperCase()`
 * (`domain/reading-rooms/value-objects/room-id.vo.ts:13-27`). Chấp nhận chữ
 * thường ở biên vì client gửi nguyên văn URL.
 *
 * KHÔNG phải ObjectId — xem DEC-01.
 */
export const ROOM_ID_PATTERN = /^[A-Za-z0-9]{6,10}$/;

/**
 * Highlight id do domain sinh bằng `crypto.randomUUID()`
 * (`domain/reading-rooms/entities/reading-room.entity.ts:263`).
 *
 * KHÔNG phải ObjectId — xem DEC-01.
 */
export const HIGHLIGHT_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Mongo ObjectId 24 hex — `bookId`, `chapterId`, `userId`, `newHostId`. */
export const OBJECT_ID_PATTERN = /^[0-9a-f]{24}$/i;

/**
 * Chặn ở biên trước khi chạm vào Mongoose: `findById` ném CastError khi gặp
 * chuỗi không phải ObjectId.
 */
export const isObjectId = (value: unknown): value is string =>
  typeof value === 'string' && OBJECT_ID_PATTERN.test(value);

/* -------------------------------------------------------------------------- */
/* Giới hạn độ dài — lấy từ domain                                            */
/* -------------------------------------------------------------------------- */

/** `roomId` dài 6–10 ký tự (`domain/.../room-id.vo.ts:26`). */
export const ROOM_ID_MIN_LENGTH = 6;
export const ROOM_ID_MAX_LENGTH = 10;

/** `content` highlight: 1–1000 ký tự sau trim (`reading-room.entity.ts:230-235`). */
export const HIGHLIGHT_CONTENT_MIN_LENGTH = 1;
export const HIGHLIGHT_CONTENT_MAX_LENGTH = 1000;

/** `chapterSlug`: `/^[a-z0-9-]{1,200}$/` (`reading-room.entity.ts:243-245`). */
export const CHAPTER_SLUG_MAX_LENGTH = 200;

/** `paragraphId`: tối đa 100 ký tự (`reading-room.entity.ts:237-241`). */
export const PARAGRAPH_ID_MAX_LENGTH = 100;

/**
 * `displayName` / `avatarUrl` mà client cũ vẫn gửi kèm `join_room` — server bỏ
 * qua (DEC-02) nhưng vẫn phải chặn độ dài để không đẩy payload vô hạn.
 * Cùng giới hạn với schema của `User` (`domain/users/...`).
 */
export const CLIENT_DISPLAY_NAME_MAX_LENGTH = 80;
export const CLIENT_AVATAR_URL_MAX_LENGTH = 500;

/** Tiến độ đọc: phần trăm 0–100. */
export const PROGRESS_MIN = 0;
export const PROGRESS_MAX = 100;

/**
 * Idempotency key do client cấp cho mutation ghi (T16).
 * Chỉ dùng ký tự an toàn cho key — tránh `:` phá vỡ key Redis.
 */
export const CLIENT_MUTATION_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

/** Độ dài tối đa cho các field client gửi thừa mà server bỏ qua (DEC-02). */
export const IGNORED_FIELD_MAX_LENGTH = 64;

/* -------------------------------------------------------------------------- */
/* Option của namespace /reading-rooms (truyền vào @WebSocketGateway)          */
/* -------------------------------------------------------------------------- */

/**
 * Kích thước payload tối đa (byte) mà server chấp nhận.
 *
 * Vượt ngưỡng ⇒ Engine.IO **đóng connection**, không trả `error` event — client
 * chỉ thấy `disconnect`. Nhỏ hơn mặc định 1 MB của socket.io để chặn payload rác
 * ngay ở tầng transport, trước khi parse JSON.
 */
export const WS_MAX_HTTP_BUFFER_SIZE = 100 * 1024;

/** Thời gian tối đa cho một lần bắt tay (handshake) hoàn tất. */
export const WS_CONNECT_TIMEOUT_MS = 10_000;

/** Chu kỳ ping của engine (giữ kết nối qua proxy/nginx). */
export const WS_PING_INTERVAL_MS = 25_000;

/** Chờ tối đa bao lâu sau ping trước khi coi là chết. */
export const WS_PING_TIMEOUT_MS = 20_000;

/** Chỉ cho phép `websocket` thuần (bỏ polling) — khớp `transport` của client. */
export const WS_TRANSPORTS: readonly string[] = ['websocket'];

/** Origin mặc định khi `FRONTEND_URL` chưa cấu hình. */
export const DEFAULT_FRONTEND_URL = 'http://localhost:3000';

/** TTL khoá `auth:revoked:{userId}` khi ban đổi role / bị ban (7 ngày). */
export const TOKEN_REVOCATION_TTL_SECONDS = 7 * 24 * 3600;

/* -------------------------------------------------------------------------- */
/* Mã lỗi ở biên WebSocket                                                    */
/* -------------------------------------------------------------------------- */

export const VALIDATION_FAILED_CODE = 'VALIDATION_FAILED';
export const VALIDATION_FAILED_MESSAGE = 'Dữ liệu không hợp lệ';

export const NOT_IN_ROOM_CODE = 'NOT_IN_ROOM';
export const NOT_IN_ROOM_MESSAGE = 'Bạn chưa tham gia phòng này';

export const ROOM_MISMATCH_CODE = 'ROOM_MISMATCH';
export const ROOM_MISMATCH_MESSAGE = 'Bạn không ở trong phòng này';

export const RATE_LIMITED_CODE = 'RATE_LIMITED';

/* -------------------------------------------------------------------------- */
/* Hằng số runtime (có thể ghi đè qua ConfigService)                           */
/* -------------------------------------------------------------------------- */

export interface ReadingRoomRuntimeConfig {
  /** Presence theo (userId, socketId) thay vì (roomId, userId). */
  presencePerSocket: boolean;
  /** Limiter kết nối nguyên tử bằng Lua + sorted set. */
  connectionLimiterRedis: boolean;
  /** Ngắt socket khi JWT hết hạn. */
  sessionExpiryDisconnect: boolean;
  /** Ack `{ ok, data | error }` cho mọi event ghi. */
  ackContractV2: boolean;
  /** Chạy insight AI qua BullMQ. */
  insightQueue: boolean;
  /** Số highlight tối đa trong snapshot `join_room`. */
  snapshotLimit: number;
}

/** Số kết nối đồng thời tối đa cho một user (đường cũ và đường Lua). */
export const MAX_CONNECTIONS_PER_USER = 5;

/** Cửa sổ cố định của rate limit: 60 giây. */
export const RATE_LIMIT_WINDOW_SECONDS = 60;

/** Debounce broadcast presence cho mỗi phòng. */
export const PRESENCE_BROADCAST_DEBOUNCE_MS = 3_000;

/** Debounce ghi tiến độ đọc. */
export const PROGRESS_FLUSH_DEBOUNCE_MS = 10_000;

/** TTL presence theo socket (DEC-07). */
export const PRESENCE_HASH_TTL_SECONDS = 90;

/** Ngưỡng coi 1 field presence là cũ = 2.5 × chu kỳ heartbeat 15s. */
export const PRESENCE_STALE_MS = 37_500;

/** TTL khoá chống bấm đôi insight. */
export const INSIGHT_LOCK_TTL_SECONDS = 60;

/** TTL idempotency key của `add_highlight`. */
export const IDEMPOTENCY_TTL_SECONDS = 300;

/** Hạn mức rate limit mặc định cho event ghi (T10). */
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
