---
name: jwt-auth-patterns
description: JWT authentication, token management, password security, guards, and authorization patterns. Triggers on tasks involving authentication, login, registration, or access control.
---

# JWT/Auth Patterns

## Overview

Comprehensive guide for implementing secure authentication and authorization in NestJS applications.

## Trigger

Activate when:
- Implementing authentication
- Setting up JWT tokens
- Building authorization guards
- Handling password security
- Managing sessions
- OAuth implementations

## Authentication Flow

```
User Login → Validate Credentials → Generate Tokens → Return to Client
                                                      ↓
Client Request → Extract Token → Validate Token → Check Permissions → Access Resource
```

## JWT Implementation

### Token Structure

```typescript
interface JwtPayload {
  sub: string;      // User ID
  email: string;
  role: UserRole;
  iat: number;       // Issued at
  exp: number;       // Expiration
}
```

### Access Token (Short-lived)

```typescript
const accessToken = this.jwtService.sign(
  { sub: user.id, email: user.email, role: user.role },
  { expiresIn: '15m' }
);
```

### Refresh Token (Long-lived)

```typescript
const refreshToken = this.jwtService.sign(
  { sub: user.id, type: 'refresh' },
  { expiresIn: '7d' }
);
```

## Auth Service Pattern

```typescript
@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private bcryptService: BcryptService,
  ) {}

  async login(dto: LoginDto): Promise<Tokens> {
    const user = await this.usersService.findByEmail(dto.email);
    
    if (!user || !await this.bcryptService.compare(dto.password, user.passwordHash)) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateTokens(user);
  }

  async refreshTokens(refreshToken: string): Promise<Tokens> {
    const payload = this.jwtService.verify(refreshToken);
    
    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Invalid token type');
    }

    const user = await this.usersService.findById(payload.sub);
    return this.generateTokens(user);
  }

  private async generateTokens(user: User): Promise<Tokens> {
    const payload = { sub: user.id, email: user.email, role: user.role };
    
    return {
      accessToken: this.jwtService.sign(payload, { expiresIn: '15m' }),
      refreshToken: this.jwtService.sign({ ...payload, type: 'refresh' }, { expiresIn: '7d' }),
    };
  }
}
```

## Guards

### JWT Auth Guard

```typescript
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token);
      request.user = payload;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }

    return true;
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
```

### Roles Guard

```typescript
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some((role) => user.role === role);
  }
}
```

### Resource Ownership Guard

```typescript
@Injectable()
export class OwnershipGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const resourceId = request.params.id;

    // Admin can access everything
    if (user.role === Role.ADMIN) {
      return true;
    }

    // Check ownership
    const resource = await this.getResource(resourceId);
    return resource.userId === user.sub;
  }
}
```

## Password Security

### Hashing

```typescript
@Injectable()
export class BcryptService {
  async hash(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(12);
    return bcrypt.hash(password, salt);
  }

  async compare(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
```

### Password Validation

```typescript
export class PasswordValidator {
  static isStrong(password: string): boolean {
    // Minimum 8 characters
    if (password.length < 8) return false;
    
    // Has uppercase
    if (!/[A-Z]/.test(password)) return false;
    
    // Has lowercase
    if (!/[a-z]/.test(password)) return false;
    
    // Has number
    if (!/[0-9]/.test(password)) return false;
    
    // Has special character
    if (!/[!@#$%^&*]/.test(password)) return false;
    
    return true;
  }
}
```

## Token Storage

### HTTP-Only Cookie (Recommended)

```typescript
// Login
res.cookie('refreshToken', refreshToken, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
});
```

### Client Storage Options

| Storage | Pros | Cons |
|---------|------|------|
| HTTP-Only Cookie | XSS resistant | CSRF vulnerable |
| Memory | XSS resistant | Lost on refresh |
| LocalStorage | Persistent | XSS vulnerable |
| SessionStorage | Session-only | Lost on close |

## Security Best Practices

1. **Use HTTPS in production**
2. **Store secrets in environment variables**
3. **Rotate tokens regularly**
4. **Implement token blacklist/revocation**
5. **Use short-lived access tokens**
6. **Secure password reset flow**
7. **Implement account lockout**
8. **Log authentication events**

## Decorators

```typescript
// Custom decorator for current user
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    return data ? user?.[data] : user;
  },
);

// Role decorator
export const Roles = (...roles: Role[]) => SetMetadata('roles', roles);

// Public route decorator
export const Public = () => SetMetadata('isPublic', true);
```

## Use Cases

```typescript
@Post('register')
async register(@Body() dto: RegisterDto) {
  // Hash password
  // Create user
  // Generate tokens
  // Return response
}

@UseGuards(JwtAuthGuard)
@Get('profile')
async getProfile(@CurrentUser('sub') userId: string) {
  return this.usersService.findById(userId);
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Post('admin-action')
async adminAction() {
  // Admin only
}
```
