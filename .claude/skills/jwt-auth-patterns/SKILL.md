---
name: jwt-auth-patterns
description: JWT authentication for this NestJS project. Covers httpOnly cookie tokens (sb_access_token / sb_refresh_token), Bearer fallback, passport-jwt strategies, the JwtAuthGuard with @Public, CSRF double-submit, banned-user checks, role resolution, OAuth (GitHub/Google), and socket token extraction. Triggers on tasks involving authentication, login, registration, tokens, guards, or access control.
---

# JWT / Auth Patterns

## Overview

Authentication uses **passport-jwt** with tokens delivered primarily via **httpOnly cookies** (`sb_access_token`, `sb_refresh_token`), with a Bearer-header fallback. Guards are global with an `@Public()` opt-out. CSRF is protected by a double-submit cookie pair.

## Trigger

Activate when working on:
- Login / register / logout / refresh flows
- JWT strategies and guards
- Cookie handling (`auth-cookie.service.ts`)
- CSRF protection
- Banned-user handling
- OAuth (GitHub / Google)
- Socket authentication

## Architecture

```
common/
├── guards/jwt-auth.guard.ts            → JwtAuthGuard (global, @Public opt-out)
├── interfaces/jwt-validated-user.interface.ts → JwtValidatedUser
├── middlewares/csrf.middleware.ts       → CSRF double-submit
└── decorators/custom.decorator.ts       → @Public, @CurrentUser
infrastructure/auth/strategies/
├── jwt.strategy.ts                      → access-token strategy
├── jwt-refresh.strategy.ts              → refresh-token strategy
├── local.strategy.ts                    → email/password
├── github-oauth.strategy.ts
└── google-oauth.strategy.ts
application/auth/services/auth-cookie.service.ts → cookie spec (name/flags/path)
presentation/gateways/socket-token.util.ts       → token from WS handshake
shared/domain/auth-cache.keys.ts                 → cache key + TTL
```

## Token Payload

```typescript
export interface JwtPayload {
  sub: string;    // user id
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

// What strategies attach to req.user
export interface JwtValidatedUser {
  id: string;
  email: string;
  role: string;
}
```

> `role` is a **string resolved from the RoleRepository** (default `'user'`) — not a hard-coded enum.

## Cookies (Primary Token Transport)

Tokens live in **httpOnly cookies**, set through a single cookie-spec service:

```typescript
// application/auth/services/auth-cookie.service.ts
// Access token: path '/', httpOnly
{ name: 'sb_access_token',  httpOnly: true, path: '/' }
// Refresh token: scoped to the auth routes only
{ name: 'sb_refresh_token', httpOnly: true, path: '/api/auth' }
```

- **httpOnly: true** for both tokens — JS can never read them (XSS mitigation).
- **Refresh token path is narrowed** to `/api/auth` so it isn't sent on every request.
- Use `secure: true` in production, `sameSite` aligned with the frontend origin.

## Extracting the Token

Prefer the cookie, fall back to the `Authorization` header:

```typescript
// infrastructure/auth/strategies/jwt.strategy.ts
export function accessTokenFromRequest(req: {
  cookies?: Record<string, string | undefined>;
  headers?: Record<string, string | string[] | undefined>;
}): string | null {
  const cookie = req?.cookies?.['sb_access_token'];
  if (cookie) return cookie;
  return ExtractJwt.fromAuthHeaderAsBearerToken()(req);
}
```

## Access-Token Strategy

```typescript
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private readonly userRepository: IUserRepository,
    private readonly roleRepository: IRoleRepository,
    private readonly cache: ICachePort,
  ) {
    super({
      jwtFromRequest: accessTokenFromRequest,
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('env.JWT_ACCESS_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<JwtValidatedUser> {
    const userId = payload.sub;
    const cacheKey = getAuthUserCacheKey(userId); // `auth:user:${userId}`

    // 1. Cache-first: avoids a DB hit on every authenticated request
    const cached = await this.cache.get<{ role: string; isBanned: boolean }>(cacheKey);
    if (cached) {
      if (cached.isBanned) this.throwBanned();
      return { id: userId, email: payload.email, role: cached.role };
    }

    // 2. Load the user
    const user = await this.userRepository.findById(UserId.create(userId));
    if (!user) throw new UnauthorizedException();
    if (user.isBanned) this.throwBanned();

    // 3. Resolve role name (default 'user')
    const role = user.roleId ? await this.resolveRoleName(user.roleId) : 'user';

    // 4. Cache for AUTH_USER_CACHE_TTL_SECONDS (60s) — short, so bans propagate fast
    await this.cache.set(cacheKey, { role, isBanned: user.isBanned }, AUTH_USER_CACHE_TTL_SECONDS);

    return { id: userId, email: payload.email, role };
  }

  private throwBanned(): never {
    throw new ForbiddenException({
      statusCode: 403,
      message: 'Tài khoản của bạn đã bị cấm. Vui lòng liên hệ quản trị viên.',
      error: 'USER_BANNED',
    });
  }
}
```

### Key Rules

1. **`getOrThrow` for secrets** — `configService.getOrThrow<string>('env.JWT_ACCESS_SECRET')`. Never a non-null assertion or a raw `process.env` read.
2. **Banned check runs on every validate** (via the 60s cache) — a ban takes effect within a minute without a DB hit per request.
3. **Role comes from the repository**, cached alongside `isBanned`.
4. **TTL is short (60s)** on purpose: it bounds how long a revoked role/ban stays cached.

## Guard

```typescript
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) { super(); }

  handleRequest<TUser = Express.User>(
    err: Error | null, user: TUser, _info: unknown, context: ExecutionContext,
  ): TUser {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (err || !user) {
      if (isPublic) return null as TUser; // anonymous access allowed
      throw err || new UnauthorizedException('Access Token không hợp lệ hoặc không có tại header!');
    }
    return user;
  }
}
```

- Register **globally** (`APP_GUARD`); opt out per route with `@Public()`.
- `@Public()` routes still run the strategy when a token *is* present (so `req.user` may be set) — useful for optional-auth endpoints.

## CSRF Protection

Double-submit cookie pattern (`csrf.middleware.ts`):

| Cookie | httpOnly | Purpose |
|--------|----------|---------|
| `sb_csrf_secret` | `true` | Server-side secret, never readable by JS |
| `sb_csrf_token` | `false` | Derived token the frontend reads and echoes in a header |

- The **secret** stays server-side; the **token** is intentionally JS-readable so the SPA can send it back.
- All state-changing requests (POST/PUT/PATCH/DELETE) must carry the token header; the middleware validates the pair.
- Cookie-based auth **requires** CSRF protection — that's why both exist.

## OAuth (GitHub / Google)

- Strategies: `github-oauth.strategy.ts`, `google-oauth.strategy.ts`.
- **State is stored in Redis** (`redis-oauth-state.adapter.ts`) with a short TTL — validates the callback and prevents CSRF on the OAuth round-trip.
- Callback issues the same `sb_access_token` / `sb_refresh_token` cookies via `auth-cookie.service.ts` — no separate token path for OAuth.

## Socket Authentication

The WS handshake has no `Authorization` header, so the token is parsed from the cookie header:

```typescript
// presentation/gateways/socket-token.util.ts
const match = cookieHeader?.match(/(?:^|;\s*)sb_access_token=([^;]+)/);
```

The gateway then verifies with `JwtService` and disconnects on failure. See the `socketio-realtime` skill.

## Refresh Flow

- `jwt-refresh.strategy.ts` reads `sb_refresh_token` from the cookie, or accepts `body.refreshToken` as a fallback.
- Refresh tokens are signed with `JWT_REFRESH_SECRET` (distinct from the access secret).
- On refresh, rotate and re-issue both cookies.

## Anti-Patterns

- ❌ Reading `process.env.JWT_ACCESS_SECRET` directly — use `ConfigService.getOrThrow`.
- ❌ Storing tokens in `localStorage` — httpOnly cookies only.
- ❌ Long auth-cache TTL — bans/role changes must propagate quickly.
- ❌ Returning tokens in the response body — set them as cookies.
- ❌ Skipping the banned check in `validate`.
- ❌ Using the access secret for refresh tokens — always separate secrets.
