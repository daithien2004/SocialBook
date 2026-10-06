import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { LoginHandler } from '@/application/auth/commands/login/login.handler';
import { LoginCommand } from '@/application/auth/commands/login/login.command';
import { IRoleRepository } from '@/domain/roles/repositories/role.repository.interface';
import { Role } from '@/domain/roles/entities/role.entity';
import {
  UnauthorizedDomainException,
  UserBannedDomainException,
} from '@/domain/auth/exceptions/auth-exceptions';
import { User } from '@/domain/users/entities/user.entity';
import { TokenService } from '@/application/auth/services/token.service';
import { fakeOf } from '../../../../support/typed-fake';

function createMockTokenService() {
  const signTokens = jest.fn(
    (..._args: Parameters<TokenService['signTokens']>) =>
      Promise.resolve({ accessToken: '', refreshToken: '' }),
  );

  return {
    service: fakeOf<TokenService>({ signTokens }),
    signTokens,
  };
}

function createMockRoleRepository() {
  const findByName = jest.fn((_name: string): Promise<Role | null> =>
    Promise.resolve(null),
  );
  const findById = jest.fn((_id: string): Promise<Role | null> =>
    Promise.resolve(null),
  );

  return {
    repository: { findByName, findById } satisfies IRoleRepository,
    findById,
  };
}

function createVerifiedUser(): User {
  return User.reconstitute({
    id: 'user-1',
    roleId: 'role-1',
    username: 'testuser',
    email: 'test@example.com',
    password: 'hashed-password',
    isVerified: true,
    isBanned: false,
    provider: 'local',
    favoriteGenres: [],
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  });
}

function createUnverifiedUser(): User {
  return User.reconstitute({
    id: 'user-2',
    roleId: 'role-1',
    username: 'unverified',
    email: 'unverified@example.com',
    password: 'hashed-password',
    isVerified: false,
    isBanned: false,
    provider: 'local',
    favoriteGenres: [],
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  });
}

function createBannedUser(): User {
  return User.reconstitute({
    id: 'user-3',
    roleId: 'role-1',
    username: 'banned',
    email: 'banned@example.com',
    password: 'hashed-password',
    isVerified: true,
    isBanned: true,
    provider: 'local',
    favoriteGenres: [],
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  });
}

describe('LoginHandler (Unit)', () => {
  let useCase: LoginHandler;
  let mockTokenService: ReturnType<typeof createMockTokenService>;
  let mockRoleRepository: ReturnType<typeof createMockRoleRepository>;

  beforeEach(() => {
    mockTokenService = createMockTokenService();
    mockRoleRepository = createMockRoleRepository();
    useCase = new LoginHandler(
      mockTokenService.service,
      mockRoleRepository.repository,
    );
  });

  it('should return tokens and user data for a verified user', async () => {
    const user = createVerifiedUser();
    mockRoleRepository.findById.mockResolvedValue(
      Role.create({ id: 'role-1', name: 'user' }),
    );
    mockTokenService.signTokens.mockResolvedValue({
      accessToken: 'access-token-123',
      refreshToken: 'refresh-token-123',
    });

    const result = await useCase.execute(new LoginCommand(user));

    expect(result.accessToken).toBe('access-token-123');
    expect(result.refreshToken).toBe('refresh-token-123');
    expect(result.user.id).toBe('user-1');
    expect(result.user.email).toBe('test@example.com');
    expect(result.user.username).toBe('testuser');
    expect(result.user.role).toBe('user');
  });

  it('should assign default "user" role when user has no roleId', async () => {
    const userNoRole = User.reconstitute({
      id: 'user-4',
      roleId: '',
      username: 'norole',
      email: 'norole@example.com',
      isVerified: true,
      isBanned: false,
      provider: 'local',
      favoriteGenres: [],
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-01'),
    });
    mockTokenService.signTokens.mockResolvedValue({
      accessToken: 'access-token-123',
      refreshToken: 'refresh-token-123',
    });

    const result = await useCase.execute(new LoginCommand(userNoRole));

    expect(result.user.role).toBe('user');
    expect(mockRoleRepository.findById).not.toHaveBeenCalled();
  });

  it('should use role name from repository when roleId exists', async () => {
    const user = createVerifiedUser();
    mockRoleRepository.findById.mockResolvedValue(
      Role.create({ id: 'role-1', name: 'admin' }),
    );
    mockTokenService.signTokens.mockResolvedValue({
      accessToken: 'access-token-123',
      refreshToken: 'refresh-token-123',
    });

    const result = await useCase.execute(new LoginCommand(user));

    expect(result.user.role).toBe('admin');
    expect(mockRoleRepository.findById).toHaveBeenCalledWith('role-1');
  });

  it('should throw UnauthorizedDomainException when user is not verified', async () => {
    const user = createUnverifiedUser();
    await expect(useCase.execute(new LoginCommand(user))).rejects.toThrow(
      UnauthorizedDomainException,
    );
  });

  it('should throw UserBannedDomainException when user is banned', async () => {
    const user = createBannedUser();
    await expect(useCase.execute(new LoginCommand(user))).rejects.toThrow(
      UserBannedDomainException,
    );
  });

  it('should propagate errors from TokenService', async () => {
    const user = createVerifiedUser();
    mockRoleRepository.findById.mockResolvedValue(
      Role.create({ id: 'role-1', name: 'user' }),
    );
    mockTokenService.signTokens.mockRejectedValue(
      new Error('JWT signing failed'),
    );

    await expect(useCase.execute(new LoginCommand(user))).rejects.toThrow(
      'JWT signing failed',
    );
  });
});
