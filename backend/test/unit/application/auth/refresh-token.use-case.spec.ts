import { RefreshTokenUseCase } from '@/application/auth/use-cases/refresh-token/refresh-token.use-case';
import { RefreshTokenCommand } from '@/application/auth/use-cases/refresh-token/refresh-token.command';
import { TokenRotationPort } from '@/application/ports/token-rotation.port';
import { TokenService } from '@/application/auth/services/token.service';
import { IUserRepository } from '@/domain/users/repositories/user.repository.interface';
import { IRoleRepository } from '@/domain/roles/repositories/role.repository.interface';
import { IPasswordHasher } from '@/shared/domain/password-hasher.interface';
import { UnauthorizedDomainException } from '@/domain/auth/exceptions/auth-exceptions';
import { User } from '@/domain/users/entities/user.entity';
import { Role } from '@/domain/roles/entities/role.entity';

const USER_ID = 'user-1';
const EMAIL = 'user@example.com';
const REFRESH_TOKEN = 'refresh-token';
const ACCESS_TOKEN = 'access-token';

describe('RefreshTokenUseCase (Unit)', () => {
  let useCase: RefreshTokenUseCase;
  let mockUserRepository: jest.Mocked<Pick<IUserRepository, 'findById'>>;
  let mockRolesRepository: jest.Mocked<Pick<IRoleRepository, 'findById'>>;
  let mockTokenService: jest.Mocked<Pick<TokenService, 'signTokens'>>;
  let mockPasswordHasher: jest.Mocked<IPasswordHasher>;
  let mockRotationPort: jest.Mocked<TokenRotationPort>;

  const makeUser = (overrides: Partial<{ roleId: string; hashedRt: string }> = {}) =>
    ({
      id: { toString: () => USER_ID },
      email: { value: EMAIL },
      roleId: 'role-admin',
      hashedRt: 'hashed-rt',
      ...overrides,
    }) as unknown as User;

  const command = () => new RefreshTokenCommand(USER_ID, REFRESH_TOKEN);

  beforeEach(() => {
    mockUserRepository = {
      findById: jest.fn(),
    };
    mockRolesRepository = {
      findById: jest.fn(),
    };
    mockTokenService = {
      signTokens: jest.fn(),
    };
    mockPasswordHasher = {
      compare: jest.fn(),
      hash: jest.fn(),
    };
    mockRotationPort = {
      tryAcquireLock: jest.fn(),
      writeFreshTokens: jest.fn(),
      readFreshTokens: jest.fn(),
      releaseLock: jest.fn(),
    };

    useCase = new RefreshTokenUseCase(
      mockUserRepository as unknown as IUserRepository,
      mockRolesRepository as unknown as IRoleRepository,
      mockTokenService as unknown as TokenService,
      mockPasswordHasher,
      mockRotationPort,
    );
  });

  it('acquires lock, validates user & rt, signs new tokens, caches them, releases lock', async () => {
    mockRotationPort.tryAcquireLock.mockResolvedValue(true);
    mockUserRepository.findById.mockResolvedValue(makeUser());
    mockPasswordHasher.compare.mockResolvedValue(true);
    mockRolesRepository.findById.mockResolvedValue({
      name: 'admin',
    } as Role);
    mockTokenService.signTokens.mockResolvedValue({
      accessToken: ACCESS_TOKEN,
      refreshToken: 'new-refresh-token',
    });

    const result = await useCase.execute(command());

    expect(mockRotationPort.tryAcquireLock).toHaveBeenCalledWith(USER_ID);
    expect(mockUserRepository.findById).toHaveBeenCalled();
    expect(mockPasswordHasher.compare).toHaveBeenCalledWith(
      REFRESH_TOKEN,
      'hashed-rt',
    );
    expect(mockTokenService.signTokens).toHaveBeenCalledWith(
      USER_ID,
      EMAIL,
      'admin',
    );
    expect(mockRotationPort.writeFreshTokens).toHaveBeenCalled();
    expect(mockRotationPort.releaseLock).toHaveBeenCalledWith(USER_ID);
    expect(result.accessToken).toBe(ACCESS_TOKEN);
  });

  it('loser request with fresh tokens in cache returns them without touching db/sign', async () => {
    mockRotationPort.tryAcquireLock.mockResolvedValue(false);
    mockRotationPort.readFreshTokens.mockResolvedValue({
      accessToken: ACCESS_TOKEN,
      refreshToken: 'shared-new-refresh-token',
    });

    const result = await useCase.execute(command());

    expect(result.accessToken).toBe(ACCESS_TOKEN);
    expect(mockUserRepository.findById).not.toHaveBeenCalled();
    expect(mockTokenService.signTokens).not.toHaveBeenCalled();
    expect(mockRotationPort.releaseLock).not.toHaveBeenCalled();
  });

  it('loser request without cached tokens throws Unauthorized', async () => {
    mockRotationPort.tryAcquireLock.mockResolvedValue(false);
    mockRotationPort.readFreshTokens.mockResolvedValue(null);

    await expect(useCase.execute(command())).rejects.toThrow(
      UnauthorizedDomainException,
    );
    expect(mockUserRepository.findById).not.toHaveBeenCalled();
  });

  it('rejects stale refresh token and still releases the lock', async () => {
    mockRotationPort.tryAcquireLock.mockResolvedValue(true);
    mockUserRepository.findById.mockResolvedValue(makeUser());
    mockPasswordHasher.compare.mockResolvedValue(false);

    await expect(useCase.execute(command())).rejects.toThrow(
      UnauthorizedDomainException,
    );
    expect(mockTokenService.signTokens).not.toHaveBeenCalled();
    expect(mockRotationPort.releaseLock).toHaveBeenCalledWith(USER_ID);
  });

  it('rejects unknown user and releases the lock', async () => {
    mockRotationPort.tryAcquireLock.mockResolvedValue(true);
    mockUserRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute(command())).rejects.toThrow(
      UnauthorizedDomainException,
    );
    expect(mockRotationPort.releaseLock).toHaveBeenCalledWith(USER_ID);
  });

  it('releases lock in finally when a repository call fails', async () => {
    mockRotationPort.tryAcquireLock.mockResolvedValue(true);
    mockUserRepository.findById.mockRejectedValue(new Error('DB down'));

    await expect(useCase.execute(command())).rejects.toThrow('DB down');
    expect(mockRotationPort.releaseLock).toHaveBeenCalledWith(USER_ID);
  });
});