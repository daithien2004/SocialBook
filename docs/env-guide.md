# Env Guide

Hướng dẫn cấu hình biến môi trường cho từng workspace của SocialBook.

## Workspaces

```
backend/     NestJS API (cần .env ở backend/)
frontend/    Next.js web app (cần .env.local ở frontend/)
```

Các file mẫu: `backend/.env.example`, `frontend/.env.example`.

## Backend (`backend/.env`)

Validation fail-fast qua zod (`src/config/env.validation.ts`). Thiếu biến `[REQUIRED]` sẽ CRASH lúc boot.
Bỏ qua validation cho CI/test bằng `SKIP_ENV_VALIDATION=true`.

### OAuth (auth mức 3 — bỏ NextAuth)

Google và GitHub OAuth được xử lý hoàn toàn ở backend (state + PKCE, callback URL cấu hình backend-side).
Frontend chỉ gọi qua proxy `/api/auth/*` (Next.js route handlers) trỏ tới backend.

| Biến | Bắt buộc | Ghi chú |
|------|----------|---------|
| `GOOGLE_CLIENT_ID` | ✅ | Client ID trong Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | ✅ | Bắt buộc (zod fail-fast), không để trống |
| `GOOGLE_CALLBACK_URL` | ✅ | URL đăng ký trong Google console redirect URI |
| `GITHUB_CLIENT_ID` | Optional | Bỏ trống để tắt GitHub login |
| `GITHUB_CLIENT_SECRET` | Optional | Cần cùng lúc với `GITHUB_CLIENT_ID` |
| `GITHUB_CALLBACK_URL` | Optional | URL đăng ký trong GitHub OAuth app redirect URI |
| `AUTH_COOKIE_SECURE` | Optional | `true` khi HTTPS (prod), `false` khi dev local |
| `AUTH_COOKIE_SAME_SITE` | Optional | `lax` (mặc định) |

Callback URL mẫu:

- Local: `http://localhost:3000/api/auth/google/callback` (GitHub: `.../github/callback`)
- Prod: `https://socialbook.io.vn/api/auth/google/callback`

> Lưu ý: redirect URI đăng ký ở Google/GitHub phải khớp CHÍNH XÁC với `..._CALLBACK_URL` (bao gồm scheme/host/path).

### Vòng đời token

- Cookie (httpOnly, SameSite=Lax, Secure theo `AUTH_COOKIE_SECURE`):
  - `sb_access_token` — path `/`, TTL ngắn (`ACCESS_TOKEN_EXPIRES_IN=15m`)
  - `sb_refresh_token` — path `/api/auth`, TTL dài (`REFRESH_TOKEN_EXPIRES_IN=7d`)
  - `sb_oauth_state` — path `/api/auth`, dùng cho state/PKCE redirect OAuth
- Refresh rotation + family revoke: dùng lại token cũ → thu hồi cả chuỗi, phải đăng nhập lại.
- Refresh chỉ hợp lệ khi gửi tới `/api/auth/refresh`.

### Flow OAuth

1. User bấm login → FE redirect `/api/auth/google` (proxy) → backend tạo state/PKCE + redirect tới Google.
2. Google trả về → `/api/auth/google/callback` (proxy) → backend xác minh state + trao đổi code + `OAuthAuthUseCase`.
3. Thành công → set cookie + redirect `{FRONTEND_URL}{callbackUrl}?oauth=success` (callbackUrl mặc định `/login`).
4. Thất bại → redirect `/login?error={code}`.

Error code (`toErrorCode`): `EmailUsedWithPassword`, `AccountBanned`, `EmailNotVerified`, `OAuthFailed`.

### Các biến khác (đầy đủ ở `backend/.env.example`)

`MONGO_URI`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `FRONTEND_URL`, `PORT`, `ACCESS_TOKEN_EXPIRES_IN`,
`REFRESH_TOKEN_EXPIRES_IN`, `RESEND_API_KEY`, `CLOUDINARY_*`, `REDIS_*`, `CHROMA_*`, `MODERATION_*`, `AI_*`, ...

## Frontend (`frontend/.env.local`)

Xem `frontend/.env.example`. Frontend KHÔNG nhận OAuth client secret — tất cả credentials của Google/GitHub
đều nằm ở `backend/.env`.

| Biến | Ghi chú |
|------|---------|
| `NEXT_PUBLIC_NEST_API_URL` | Base URL backend browser gọi trực tiếp (vd `http://localhost:5000/api`) |
| `NEXT_PUBLIC_SOCKET_URL` | Base URL Socket.IO (vd `http://localhost:5000`) |
| `NEST_API_INTERNAL_URL` | [Optional] Úơm backend gọi tới Next.js server (SSR). Không set → fallback `NEXT_PUBLIC_NEST_API_URL` |

## Đăng nhập local/testing

- Tạo `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET`: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`
  (>= 32 ký tự, tránh ký tự `:` đặc biệt không phù hợp cookie).
- Muốn chạy backend không cần Redis/Mongo thật khi test: tham khảo `SKIP_ENV_VALIDATION=true` + docker-compose.