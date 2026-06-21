import { LoginUseCase } from '@/application/auth/use-cases/login/login.use-case';
import { LoginCommand } from '@/application/auth/use-cases/login/login.command';
import { TokenService } from '@/application/auth/services/token.service';
import { IRoleRepository } from '@/domain/roles/repositories/role.repository.interface';
import {
  UnauthorizedDomainException,
  UserBannedDomainException,
} from '@/domain/auth/exceptions/auth-exceptions';
import { User } from '@/domain/users/entities/user.entity';

function createMockTokenService(): jest.Mocked<Partial<TokenService>> {
  return {
    signTokens: jest.fn(),
  } as any;
}

function createMockRoleRepository(): jest.Mocked<IRoleRepository> {
  return {
    findByName: jest.fn(),
    findById: jest.fn(),
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

describe('LoginUseCase (Unit)', () => {
  let useCase: LoginUseCase;
  let mockTokenService: ReturnType<typeof createMockTokenService>;
  let mockRoleRepository: ReturnType<typeof createMockRoleRepository>;

  beforeEach(() => {
    mockTokenService = createMockTokenService();
    mockRoleRepository = createMockRoleRepository();
    useCase = new LoginUseCase(mockTokenService as any, mockRoleRepository);
  });

  it('should return tokens and user data for a verified user', async () => {
    const user = createVerifiedUser();
    mockRoleRepository.findById.mockResolvedValue({ id: 'role-1', name: 'user' } as any);
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
    const user = createVerifiedUser();
    const userNoRole = User.reconstitute({
      id: 'user-4',
      roleId: null as any,
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
    mockRoleRepository.findById.mockResolvedValue({ id: 'role-1', name: 'admin' } as any);
    mockTokenService.signTokens.mockResolvedValue({
      accessToken: 'access-token-123',
      refreshToken: 'refresh-token-123',
    });

    const result = await useCase.execute(new LoginCommand(user));

    expect(result.user.role).toBe('admin');
    expect(mockRoleRepository.findById).toHaveBeenCalledWith('role-1');
  });

  it('should throw UnauthorizedDomainException when user is null', async () => {
    await expect(
      useCase.execute(new LoginCommand(null)),
    ).rejects.toThrow(UnauthorizedDomainException);
  });

  it('should throw UnauthorizedDomainException when user is not verified', async () => {
    const user = createUnverifiedUser();
    await expect(
      useCase.execute(new LoginCommand(user)),
    ).rejects.toThrow(UnauthorizedDomainException);
  });

  it('should throw UserBannedDomainException when user is banned', async () => {
    const user = createBannedUser();
    await expect(
      useCase.execute(new LoginCommand(user)),
    ).rejects.toThrow(UserBannedDomainException);
  });

  it('should propagate errors from TokenService', async () => {
    const user = createVerifiedUser();
    mockRoleRepository.findById.mockResolvedValue({ id: 'role-1', name: 'user' } as any);
    mockTokenService.signTokens.mockRejectedValue(new Error('JWT signing failed'));

    await expect(
      useCase.execute(new LoginCommand(user)),
    ).rejects.toThrow('JWT signing failed');
  });
});
