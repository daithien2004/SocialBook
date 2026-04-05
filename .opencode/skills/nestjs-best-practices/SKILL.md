---
name: nestjs-best-practices
description: NestJS architecture patterns, dependency injection, controllers, services, guards, interceptors, and testing best practices. Triggers on tasks involving NestJS modules, dependency injection, or backend API development.
---

# NestJS Best Practices

## Overview

This skill provides comprehensive guidelines for building robust NestJS applications following industry best practices.

## Trigger

Activate when working on:
- NestJS module structure
- Dependency injection patterns
- Controller/service architecture
- Guards, interceptors, pipes
- Testing NestJS applications
- Performance optimization

## Module Structure

### Recommended Architecture

```
src/
├── common/
│   ├── decorators/
│   ├── filters/
│   ├── guards/
│   ├── interceptors/
│   ├── pipes/
│   └── interfaces/
├── modules/
│   └── [feature]/
│       ├── dto/
│       ├── entities/
│       ├── repositories/
│       └── [feature].controller.ts
│       └── [feature].service.ts
│       └── [feature].module.ts
└── config/
```

### Clean Architecture Layers

```
Presentation (Controllers) → Application (Use Cases) → Domain (Entities) ← Infrastructure (Repositories)
```

## Dependency Injection

### DO

```typescript
// Use constructor injection
constructor(
  private readonly userService: UsersService,
  @Inject('CUSTOM_TOKEN') private readonly customService: CustomService,
) {}
```

### DON'T

```typescript
// Avoid property injection
@Injectable()
export class UserService {
  @Inject(UsersRepository)
  private usersRepository: UsersRepository;
}
```

## Controllers

### Best Practices

```typescript
@Controller('users')
export class UsersController {
  // 1. Use DTOs for validation
  // 2. Delegate business logic to services
  // 3. Return consistent response format
  // 4. Use proper HTTP status codes
}
```

### Response Format

```typescript
// Success response
{
  message: 'Operation successful',
  data: { ... },
  meta?: { ... }
}

// Error response
{
  statusCode: 400,
  message: 'Validation failed',
  error: 'Bad Request'
}
```

## Services

### Single Responsibility

```typescript
// GOOD: Focused service
@Injectable()
export class UserRegistrationService {
  async register(dto: CreateUserDto): Promise<User> {
    // Registration logic only
  }
}

// BAD: God service
@Injectable()
export class UserService {
  async register() { /* ... */ }
  async login() { /* ... */ }
  async export() { /* ... */ }
  async import() { /* ... */ }
}
```

## DTOs and Validation

### Use class-validator

```typescript
export class CreateUserDto {
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  name: string;

  @IsEmail()
  email: string;

  @IsEnum(UserRole)
  role: UserRole;
}
```

## Guards and Auth

```typescript
// Custom guard
@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    // Validate token
    // Check permissions
    return true;
  }
}
```

## Exception Handling

```typescript
// Use built-in exceptions
throw new NotFoundException('User not found');
throw new BadRequestException('Invalid input');
throw new UnauthorizedException();

// Custom exceptions
throw new BusinessException('CUSTOM_ERROR_CODE');
```

## Testing

### Unit Testing Services

```typescript
describe('UsersService', () => {
  let service: UsersService;
  let repository: UsersRepository;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: UsersRepository, useValue: mockRepository },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });
});
```

## Performance Tips

1. **Use `lean()` for read-only queries**
2. **Implement caching with Redis**
3. **Use database indexes**
4. **Lazy load modules**
5. **Enable compression**

## Configuration

```typescript
// config.service.ts
@Injectable()
export class ConfigService {
  constructor(private configService: ConfigService) {}

  get<T>(key: string): T {
    return this.configService.get<T>(key);
  }
}
```

## Async Modules

```typescript
{
  provide: 'ASYNC_TOKEN',
  useFactory: async (configService: ConfigService) => {
    const result = await someAsyncOperation();
    return { value: result };
  },
  inject: [ConfigService],
}
```

## Key Rules

1. **Controllers delegate to services** - No business logic in controllers
2. **Services use repositories** - No direct DB access in services
3. **Use interfaces** - Dependency inversion principle
4. **Validate early** - Use DTOs with class-validator
5. **Throw specific exceptions** - Use appropriate HTTP exceptions
6. **Log appropriately** - Use NestJS Logger
7. **Test at multiple levels** - Unit, integration, e2e
