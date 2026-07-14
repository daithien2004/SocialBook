import {
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { RegisterUseCase } from '@/application/auth/use-cases/register/register.use-case';
import { RegisterCommand } from '@/application/auth/use-cases/register/register.command';
import { IUserRepository } from '@/domain/users/repositories/user.repository.interface';
import { CreateUserUseCase } from '@/application/users/use-cases/create-user/create-user.use-case';
import { GetRoleByNameUseCase } from '@/application/roles/use-cases/get-role-by-name.use-case';
import { SendOtpUseCase } from '@/application/otp/use-cases/send-otp.use-case';
import { User } from '@/domain/users/entities/user.entity';

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
  return { execute: jest.fn() } as any;
}

function createMockGetRoleByNameUseCase(): jest.Mocked<
  Partial<GetRoleByNameUseCase>
> {
  return { execute: jest.fn() } as any;
}

function createMockSendOtpUseCase(): jest.Mocked<Partial<SendOtpUseCase>> {
  return { execute: jest.fn() } as any;
}

function createMockPasswordHasher(): jest.Mocked<{
  hash: jest.Mock;
  compare: jest.Mock;
}> {
  return { hash: jest.fn(), compare: jest.fn() };
}

function createUnverifiedExistingUser(): User {
  return User.reconstitute({
    id: 'existing-1',
    roleId: 'role-1',
    username: 'olduser',
    email: 'existing@example.com',
    password: 'old-hash',
    isVerified: false,
    isBanned: false,
    provider: 'local',
    favoriteGenres: [],
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  });
}

function createVerifiedExistingUser(): User {
  return User.reconstitute({
    id: 'existing-2',
    roleId: 'role-1',
    username: 'verifieduser',
    email: 'verified@example.com',
    password: 'hash',
    isVerified: true,
    isBanned: false,
    provider: 'local',
    favoriteGenres: [],
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  });
}

describe('RegisterUseCase (Unit)', () => {
  let useCase: RegisterUseCase;
  let mockUserRepo: ReturnType<typeof createMockUserRepository>;
  let mockCreateUser: ReturnType<typeof createMockCreateUserUseCase>;
  let mockGetRoleByName: ReturnType<typeof createMockGetRoleByNameUseCase>;
  let mockSendOtp: ReturnType<typeof createMockSendOtpUseCase>;
  let mockPasswordHasher: ReturnType<typeof createMockPasswordHasher>;

  beforeEach(() => {
    mockUserRepo = createMockUserRepository();
    mockCreateUser = createMockCreateUserUseCase();
    mockGetRoleByName = createMockGetRoleByNameUseCase();
    mockSendOtp = createMockSendOtpUseCase();
    mockPasswordHasher = createMockPasswordHasher();

    useCase = new RegisterUseCase(
      mockUserRepo as any,
      mockCreateUser as any,
      mockGetRoleByName as any,
      mockSendOtp as any,
      mockPasswordHasher as any,
    );
  });

  it('should register a new user successfully', async () => {
    mockUserRepo.findByEmail.mockResolvedValue(null);
    mockGetRoleByName.execute.mockResolvedValue({
      id: 'role-user',
      name: 'user',
    } as any);
    mockCreateUser.execute.mockResolvedValue(undefined);
    mockSendOtp.execute.mockResolvedValue(undefined);

    const result = await useCase.execute(
      new RegisterCommand('newuser@example.com', 'newuser', 'Password123!'),
    );

    expect(result).toBe('Mã OTP đã được gửi đến email của bạn');
    expect(mockCreateUser.execute).toHaveBeenCalled();
    expect(mockSendOtp.execute).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'newuser@example.com' }),
    );
  });

  it('should resend OTP when existing user is not verified', async () => {
    const existingUser = createUnverifiedExistingUser();
    mockUserRepo.findByEmail.mockResolvedValue(existingUser);
    mockPasswordHasher.hash.mockResolvedValue('new-hash');
    mockUserRepo.save.mockResolvedValue(undefined);
    mockSendOtp.execute.mockResolvedValue(undefined);

    const result = await useCase.execute(
      new RegisterCommand('existing@example.com', 'updateduser', 'NewPass123!'),
    );

    expect(result).toBe('Mã OTP đã được gửi đến email của bạn');
    expect(mockPasswordHasher.hash).toHaveBeenCalledWith('NewPass123!');
    expect(mockUserRepo.save).toHaveBeenCalled();
    expect(mockCreateUser.execute).not.toHaveBeenCalled();
  });

  it('should throw ConflictException when email is already registered and verified', async () => {
    const verifiedUser = createVerifiedExistingUser();
    mockUserRepo.findByEmail.mockResolvedValue(verifiedUser);

    await expect(
      useCase.execute(
        new RegisterCommand('verified@example.com', 'newuser', 'Password123!'),
      ),
    ).rejects.toThrow(ConflictException);
  });

  it('should throw InternalServerErrorException when user role is not found', async () => {
    mockUserRepo.findByEmail.mockResolvedValue(null);
    mockGetRoleByName.execute.mockResolvedValue(null);

    await expect(
      useCase.execute(
        new RegisterCommand('newuser@example.com', 'newuser', 'Password123!'),
      ),
    ).rejects.toThrow(InternalServerErrorException);
  });

  it('should propagate errors from SendOtpUseCase', async () => {
    mockUserRepo.findByEmail.mockResolvedValue(null);
    mockGetRoleByName.execute.mockResolvedValue({
      id: 'role-user',
      name: 'user',
    } as any);
    mockCreateUser.execute.mockResolvedValue(undefined);
    mockSendOtp.execute.mockRejectedValue(
      new Error('Email service unavailable'),
    );

    await expect(
      useCase.execute(
        new RegisterCommand('newuser@example.com', 'newuser', 'Password123!'),
      ),
    ).rejects.toThrow('Email service unavailable');
  });
});
