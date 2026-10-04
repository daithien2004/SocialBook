import { ErrorCode } from './error-codes';

export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  [ErrorCode.INTERNAL_ERROR]: 'Lỗi hệ thống, vui lòng thử lại sau',
  [ErrorCode.WS_ERROR]: 'Lỗi kết nối realtime',
  [ErrorCode.VALIDATION_ERROR]: 'Dữ liệu không hợp lệ',
  [ErrorCode.NOT_FOUND]: 'Không tìm thấy tài nguyên',
  [ErrorCode.BAD_REQUEST]: 'Yêu cầu không hợp lệ',
  [ErrorCode.CONFLICT]: 'Xung đột dữ liệu',
  [ErrorCode.FORBIDDEN]: 'Không có quyền truy cập',
  [ErrorCode.CONCURRENCY_CONFLICT]: 'Dữ liệu vừa thay đổi từ người dùng khác, vui lòng thử lại',
  [ErrorCode.ROOM_FULL]: 'Phòng đã đầy',
  [ErrorCode.DOMAIN_ERROR]: 'Lỗi xử lý nghiệp vụ',
  [ErrorCode.RATE_LIMITED]: 'Thao tác quá nhanh, vui lòng thử lại sau',
  [ErrorCode.NOT_IN_ROOM]: 'Bạn chưa tham gia phòng này',
  [ErrorCode.ROOM_MISMATCH]: 'Bạn không ở trong phòng này',
  [ErrorCode.UNAUTHORIZED]: 'Phiên đăng nhập không hợp lệ',
  [ErrorCode.TOKEN_EXPIRED]: 'Phiên đăng nhập đã hết hạn',
  [ErrorCode.TOKEN_REVOKED]: 'Phiên đăng nhập đã bị thu hồi, vui lòng đăng nhập lại',
  [ErrorCode.TOO_MANY_CONNECTIONS]: 'Bạn đang mở quá nhiều kết nối',
};

// Tra message cho code dạng string tự do (vd code đến từ WsException payload)
export const messageOf = (code: string, fallback?: string): string =>
  (ERROR_MESSAGES as Record<string, string>)[code] ??
  fallback ??
  ERROR_MESSAGES[ErrorCode.INTERNAL_ERROR];
