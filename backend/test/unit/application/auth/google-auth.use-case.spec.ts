import {
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { GoogleAuthUseCase } from '@/application/auth/use-cases/google-auth/google-auth.use-case';
import { GoogleAuthCommand } from '@/application/auth/use-cases/google-auth/google-auth.command';
import { GoogleIdTokenPort } from '@/application/ports/google-id-token.port';
import {
  UnauthorizedDomainException,
  UserBannedDomainException,
} from '@/domain/auth/exceptions/auth-exceptions';
import { IRoleRepository } from '@/domain/roles/repositories/role.repository.interface';
import { Role } from '@/domain/roles/entities/role.entity';
import { IUserRepository } from '@/domain/users/repositories/user.repository.interface';
import { User } from '@/domain/users/entities/user.entity';
import { CreateUserUseCase } from '@/application/users/use-cases/create-user/create-user.use-case';
import { TokenService } from '@/application/auth/services/token.service';

function createMockUserRepository(): jest.Mocked<IUserRepository> {
  return {
    findByEmail: jest.fn(),
    findById: jest.fn(),
    findByUsername: jest.fn(),
    findAll: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
    existsByEmail: jest.fn(),
    existsByUsername: jest.fn(),
    existsById: jest.fn(),
    findByIds: jest.fn(),
    updateFavoriteGenres: jest.fn(),
    countByDate: jest.fn(),
    countByProvider: jest.fn(),
    countAll: jest.fn(),
    countWithLocation: jest.fn(),
    findSampleUsersWithLocation: jest.fn(),
    getGeographicDistribution: jest.fn(),
    getGrowthMetrics: jest.fn(),
  };
}

function createMockCreateUserUseCase(): jest.Mocked<
  Partial<CreateUserUseCase>
> {
  return { execute: jest.fn() };
}

function createMockRolesRepository(): jest.Mocked<IRoleRepository> {
  return {
    findByName: jest.fn(),
    findById: jest.fn(),
  };
}

function createMockTokenService(): jest.Mocked<Partial<TokenService>> {
  return {
    signTokens: jest.fn(),
  };
}

function createMockGoogleIdTokenPort(): jest.Mocked<GoogleIdTokenPort> {
  return { verify: jest.fn() };
}

function createRole(name: string): Role {
  return Role.reconstitute({
    id: `role-${name}`,
    name,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  });
}

function createUser(props: {
  id: string;
  email: string;
  provider: string;
  isVerified?: boolean;
  isBanned?: boolean;
  roleId?: string;
}): User {
  return User.reconstitute({
    id: props.id,
    roleId: props.roleId ?? 'role-user',
    username: props.email.split('@')[0],
    email: props.email,
    isVerified: props.isVerified ?? true,
    isBanned: props.isBanned ?? false,
    provider: props.provider,
    favoriteGenres: [],
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  });
}

const VALID_TOKEN = 'google-valid-id-token';

function validCommand(): GoogleAuthCommand {
  return new GoogleAuthCommand(
    'google@example.com',
    'google-sub-1',
    VALID_TOKEN,
    'googleuser',
    'https://example.com/avatar.png',
    'Google User',
  );
}

describe('GoogleAuthUseCase', () => {
  let userRepository: jest.Mocked<IUserRepository>;
  let createUserUseCase: jest.Mocked<Partial<CreateUserUseCase>>;
  let rolesRepository: jest.Mocked<IRoleRepository>;
  let tokenService: jest.Mocked<Partial<TokenService>>;
  let googleIdTokenPort: jest.Mocked<GoogleIdTokenPort>;
  let useCase: GoogleAuthUseCase;

  const tokenPair = {
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
  };

  beforeEach(() => {
    userRepository = createMockUserRepository();
    createUserUseCase = createMockCreateUserUseCase();
    rolesRepository = createMockRolesRepository();
    tokenService = createMockTokenService();
    googleIdTokenPort = createMockGoogleIdTokenPort();
    (tokenService.signTokens as jest.Mock).mockResolvedValue(tokenPair);

    useCase = new GoogleAuthUseCase(
      userRepository,
      createUserUseCase as unknown as CreateUserUseCase,
      rolesRepository,
      tokenService as unknown as TokenService,
      googleIdTokenPort,
    );
  });

  it('từ chối khi id_token không hợp lệ', async () => {
    googleIdTokenPort.verify.mockResolvedValue(null);

    await expect(useCase.execute(validCommand())).rejects.toThrow(
      UnauthorizedDomainException,
    );
    expect(userRepository.findByEmail).not.toHaveBeenCalled();
  });

  it('từ chối khi payload không khớp email body', async () => {
    googleIdTokenPort.verify.mockResolvedValue({
      email: 'other@example.com',
      sub: 'google-sub-1',
    });

    await expect(useCase.execute(validCommand())).rejects.toThrow(
      UnauthorizedDomainException,
    );
  });

  it('từ chối khi payload không khớp googleId body', async () => {
    googleIdTokenPort.verify.mockResolvedValue({
      email: 'google@example.com',
      sub: 'different-sub',
    });

    await expect(useCase.execute(validCommand())).rejects.toThrow(
      UnauthorizedDomainException,
    );
  });

  it('đăng ký user mới với provider google và tự verify', async () => {
    googleIdTokenPort.verify.mockResolvedValue({
      email: 'google@example.com',
      sub: 'google-sub-1',
    });
    userRepository.findByEmail.mockResolvedValue(null);
    rolesRepository.findByName.mockResolvedValue(createRole('user'));
    const newUser = createUser({
      id: 'new-1',
      email: 'google@example.com',
      provider: 'google',
    });
    (createUserUseCase.execute as jest.Mock).mockResolvedValue(newUser);

    const result = await useCase.execute(validCommand());

    expect(createUserUseCase.execute).toHaveBeenCalled();
    expect(userRepository.save).toHaveBeenCalledWith(newUser);
    expect(tokenService.signTokens).toHaveBeenCalledWith(
      'new-1',
      'google@example.com',
      'user',
    );
    expect(result.accessToken).toBe('access-token');
  });

  it('báo lỗi khi role user chưa được seed', async () => {
    googleIdTokenPort.verify.mockResolvedValue({
      email: 'google@example.com',
      sub: 'google-sub-1',
    });
    userRepository.findByEmail.mockResolvedValue(null);
    rolesRepository.findByName.mockResolvedValue(null);

    await expect(useCase.execute(validCommand())).rejects.toThrow(
      InternalServerErrorException,
    );
  });

  it('từ chối user chưa verify khi đã tồn tại', async () => {
    googleIdTokenPort.verify.mockResolvedValue({
      email: 'google@example.com',
      sub: 'google-sub-1',
    });
    userRepository.findByEmail.mockResolvedValue(
      createUser({
        id: 'u1',
        email: 'google@example.com',
        provider: 'google',
        isVerified: false,
      }),
    );

    await expect(useCase.execute(validCommand())).rejects.toThrow(
      UnauthorizedDomainException,
    );
  });

  it('từ chối user bị ban', async () => {
    googleIdTokenPort.verify.mockResolvedValue({
      email: 'google@example.com',
      sub: 'google-sub-1',
    });
    userRepository.findByEmail.mockResolvedValue(
      createUser({
        id: 'u-banned',
        email: 'google@example.com',
        provider: 'google',
        isBanned: true,
      }),
    );

    await expect(useCase.execute(validCommand())).rejects.toThrow(
      UserBannedDomainException,
    );
  });

  it('từ chối khi email đã đăng ký bằng mật khẩu (provider local)', async () => {
    googleIdTokenPort.verify.mockResolvedValue({
      email: 'google@example.com',
      sub: 'google-sub-1',
    });
    userRepository.findByEmail.mockResolvedValue(
      createUser({
        id: 'u-local',
        email: 'google@example.com',
        provider: 'local',
      }),
    );

    await expect(useCase.execute(validCommand())).rejects.toThrow(
      ConflictException,
    );
  });

  it('đăng nhập user google đã tồn tại', async () => {
    googleIdTokenPort.verify.mockResolvedValue({
      email: 'google@example.com',
      sub: 'google-sub-1',
    });
    userRepository.findByEmail.mockResolvedValue(
      createUser({
        id: 'u-existing',
        email: 'google@example.com',
        provider: 'google',
      }),
    );
    rolesRepository.findById.mockResolvedValue(createRole('user'));

    const result = await useCase.execute(validCommand());

    expect(tokenService.signTokens).toHaveBeenCalledWith(
      'u-existing',
      'google@example.com',
      'user',
    );
    expect(result.refreshToken).toBe('refresh-token');
  });
});
