export interface FreshTokens {
  accessToken: string;
  refreshToken: string;
}

/**
 * Phối hợp xoay vòng refresh token trước các request song song:
 * chỉ 1 request được xoay vòng, các request còn lại ăn kè kết quả từ cache
 * (tránh race read-compare-write → last-write-wins làm mất refresh token mới).
 */
export abstract class TokenRotationPort {
  abstract tryAcquireLock(userId: string): Promise<boolean>;
  abstract writeFreshTokens(
    userId: string,
    tokens: FreshTokens,
    ttlSeconds: number,
  ): Promise<void>;
  abstract readFreshTokens(userId: string): Promise<FreshTokens | null>;
  abstract releaseLock(userId: string): Promise<void>;
}
