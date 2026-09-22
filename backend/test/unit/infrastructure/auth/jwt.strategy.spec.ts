import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from '@/infrastructure/auth/strategies/jwt.strategy';
import { IUserRepository } from '@/domain/users/repositories/user.repository.interface';
import { IRoleRepository } from '@/domain/roles/repositories/role.repository.interface';
import { ICachePort } from '@/shared/domain/cache.port';
import {
  AUTH_USER_CACHE_TTL_SECONDS,
  getAuthUserCacheKey,
} from '@/shared/domain/auth-cache.keys';
import { User } from '@/domain/users/entities/user.entity';

function createMockConfigService(): { getOrThrow: jest.Mock } {
  return {
    getOrThrow: jest.fn().mockReturnValue('test-secret'),
  };
}

function createMockUserRepository(): jest.Mocked<Partial<IUserRepository>> {
  return {
    findById: jest.fn(),
  };
}

function createMockRoleRepository(): jest.Mocked<IRoleRepository> {
  return {
    findByName: jest.fn(),
    findById: jest.fn(),
  };
}

function createMockCache(): jest.Mocked<ICachePort> {
  return {
    get: jest.fn(),
    set: jest.fn(),
    setIfNotExists: jest.fn(),
    del: jest.fn(),
    reset: jest.fn(),
  };
}

function createUser(props: {
  id: string;
  roleId: string | null;
  isBanned?: boolean;
}): User {
  return User.reconstitute({
    id: props.id,
    roleId: props.roleId as string,
    username: 'testuser',
    email: 'test@example.com',
    password: 'hashed-password',
    isVerified: true,
    isBanned: props.isBanned ?? false,
    provider: 'local',
    favoriteGenres: [],
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  });
}

describe('JwtStrategy (Unit)', () => {
  let strategy: JwtStrategy;
  let userRepository: ReturnType<typeof createMockUserRepository>;
  let roleRepository: ReturnType<typeof createMockRoleRepository>;
  let cache: ReturnType<typeof createMockCache>;

  beforeEach(() => {
    userRepository = createMockUserRepository();
    roleRepository = createMockRoleRepository();
    cache = createMockCache();
    strategy = new JwtStrategy(
      createMockConfigService() as any,
      userRepository as any,
      roleRepository as any,
      cache as any,
    );
  });

  it('should return user info from cache without querying DB', async () => {
    cache.get.mockResolvedValue({ role: 'admin', isBanned: false });

    const result = await strategy.validate({
      sub: 'user-1',
      email: 'test@example.com',
      role: 'user',
    });

    expect(userRepository.findById).not.toHaveBeenCalled();
    expect(roleRepository.findById).not.toHaveBeenCalled();
    expect(result).toEqual({
      id: 'user-1',
      email: 'test@example.com',
      role: 'admin',
    });
  });

  it('should throw ForbiddenException when cached user is banned', async () => {
    cache.get.mockResolvedValue({ role: 'user', isBanned: true });

    await expect(
      strategy.validate({
        sub: 'user-1',
        email: 'test@example.com',
        role: 'user',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(userRepository.findById).not.toHaveBeenCalled();
  });

  it('should query DB and cache when cache misses', async () => {
    cache.get.mockResolvedValue(null);
    userRepository.findById.mockResolvedValue(
      createUser({ id: 'user-1', roleId: 'role-1' }),
    );
    roleRepository.findById.mockResolvedValue({
      id: 'role-1',
      name: 'writer',
    } as any);

    const result = await strategy.validate({
      sub: 'user-1',
      email: 'test@example.com',
      role: 'user',
    });

    expect(userRepository.findById).toHaveBeenCalledTimes(1);
    expect(roleRepository.findById).toHaveBeenCalledWith('role-1');
    expect(cache.set).toHaveBeenCalledWith(
      getAuthUserCacheKey('user-1'),
      { role: 'writer', isBanned: false },
      AUTH_USER_CACHE_TTL_SECONDS,
    );
    expect(result.role).toBe('writer');
  });

  it('should default to "user" role when user has no roleId', async () => {
    cache.get.mockResolvedValue(null);
    userRepository.findById.mockResolvedValue(
      createUser({ id: 'user-2', roleId: null }),
    );

    const result = await strategy.validate({
      sub: 'user-2',
      email: 'test@example.com',
      role: 'user',
    });

    expect(roleRepository.findById).not.toHaveBeenCalled();
    expect(result.role).toBe('user');
  });

  it('should throw UnauthorizedException when user not found', async () => {
    cache.get.mockResolvedValue(null);
    userRepository.findById.mockResolvedValue(null);

    await expect(
      strategy.validate({
        sub: 'missing',
        email: 'x@example.com',
        role: 'user',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(cache.set).not.toHaveBeenCalled();
  });

  it('should throw ForbiddenException when user is banned', async () => {
    cache.get.mockResolvedValue(null);
    userRepository.findById.mockResolvedValue(
      createUser({ id: 'user-1', roleId: 'role-1', isBanned: true }),
    );

    await expect(
      strategy.validate({
        sub: 'user-1',
        email: 'test@example.com',
        role: 'user',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(cache.set).not.toHaveBeenCalled();
  });
});
