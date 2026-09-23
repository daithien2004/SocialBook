export interface GoogleIdTokenPayload {
  email: string;
  sub: string;
  name?: string;
  picture?: string;
}

/**
 * Xác thực Google ID token do frontend truyền lên (từ NextAuth account.id_token).
 * Trả về payload đã được Google ký, hoặc null nếu token không hợp lệ / hết hạn /
 * backend chưa được cấu hình GOOGLE_CLIENT_ID.
 */
export abstract class GoogleIdTokenPort {
  abstract verify(idToken: string): Promise<GoogleIdTokenPayload | null>;
}
