import {
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { OAuthAuthUseCase } from '@/application/auth/use-cases/oauth-auth/oauth-auth.use-case';
import { OAuthAuthCommand } from '@/application/auth/use-cases/oauth-auth/oauth-auth.command';
import { OAuthProfile } from '@/application/auth/services/oauth-provider.strategy';
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

const profile: OAuthProfile = {
  provider: 'google',
  providerId: 'sub-1',
  email: 'a@b.co',
  emailVerified: true,
  name: 'A',
  image: 'pic',
};

describe('OAuthAuthUseCase', () => {
  let userRepository: jest.Mocked<IUserRepository>;
  let createUserUseCase: jest.Mocked<Partial<CreateUserUseCase>>;
  let rolesRepository: jest.Mocked<IRoleRepository>;
  let tokenService: jest.Mocked<Partial<TokenService>>;
  let useCase: OAuthAuthUseCase;

  const tokenPair = {
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
  };

  beforeEach(() => {
    userRepository = createMockUserRepository();
    createUserUseCase = createMockCreateUserUseCase();
    rolesRepository = createMockRolesRepository();
    tokenService = createMockTokenService();
    (tokenService.signTokens as jest.Mock).mockResolvedValue(tokenPair);

    useCase = new OAuthAuthUseCase(
      userRepository,
      createUserUseCase as unknown as CreateUserUseCase,
      rolesRepository,
      tokenService as unknown as TokenService,
    );
  });

  it('từ chối email chưa được xác thực bởi provider', async () => {
    await expect(
      useCase.execute(
        new OAuthAuthCommand({ ...profile, emailVerified: false }),
      ),
    ).rejects.toThrow(UnauthorizedDomainException);
    expect(userRepository.findByEmail).not.toHaveBeenCalled();
  });

  it('đăng ký user mới với provider và tự verify', async () => {
    userRepository.findByEmail.mockResolvedValue(null);
    rolesRepository.findByName.mockResolvedValue(createRole('user'));
    const newUser = createUser({
      id: 'new-1',
      email: 'a@b.co',
      provider: 'google',
    });
    (createUserUseCase.execute as jest.Mock).mockResolvedValue(newUser);

    const result = await useCase.execute(new OAuthAuthCommand(profile));

    expect(createUserUseCase.execute).toHaveBeenCalled();
    expect(userRepository.save).toHaveBeenCalledWith(newUser);
    expect(tokenService.signTokens).toHaveBeenCalledWith(
      'new-1',
      'a@b.co',
      'user',
    );
    expect(result.accessToken).toBe('access-token');
  });

  it('báo lỗi khi role user chưa được seed', async () => {
    userRepository.findByEmail.mockResolvedValue(null);
    rolesRepository.findByName.mockResolvedValue(null);

    await expect(
      useCase.execute(new OAuthAuthCommand(profile)),
    ).rejects.toThrow(InternalServerErrorException);
  });

  it('từ chối user chưa verify khi đã tồn tại', async () => {
    userRepository.findByEmail.mockResolvedValue(
      createUser({
        id: 'u1',
        email: 'a@b.co',
        provider: 'google',
        isVerified: false,
      }),
    );

    await expect(
      useCase.execute(new OAuthAuthCommand(profile)),
    ).rejects.toThrow(UnauthorizedDomainException);
  });

  it('từ chối user bị ban', async () => {
    userRepository.findByEmail.mockResolvedValue(
      createUser({
        id: 'u-banned',
        email: 'a@b.co',
        provider: 'google',
        isBanned: true,
      }),
    );

    await expect(
      useCase.execute(new OAuthAuthCommand(profile)),
    ).rejects.toThrow(UserBannedDomainException);
  });

  it('từ chối khi email đã đăng ký bằng mật khẩu (provider local)', async () => {
    userRepository.findByEmail.mockResolvedValue(
      createUser({ id: 'u-local', email: 'a@b.co', provider: 'local' }),
    );

    await expect(
      useCase.execute(new OAuthAuthCommand(profile)),
    ).rejects.toThrow(ConflictException);
  });

  it('đăng nhập user oauth đã tồn tại', async () => {
    userRepository.findByEmail.mockResolvedValue(
      createUser({ id: 'u-existing', email: 'a@b.co', provider: 'google' }),
    );
    rolesRepository.findById.mockResolvedValue(createRole('user'));

    const result = await useCase.execute(new OAuthAuthCommand(profile));

    expect(tokenService.signTokens).toHaveBeenCalledWith(
      'u-existing',
      'a@b.co',
      'user',
    );
    expect(result.refreshToken).toBe('refresh-token');
  });
});
