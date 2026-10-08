import { jest } from '@jest/globals';
import {
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { RegisterHandler } from '@/modules/auth/application/auth/commands/register/register.handler';
import { RegisterCommand } from '@/modules/auth/application/auth/commands/register/register.command';
import { SendOtpCommand } from '@/modules/auth/application/otp/commands/send-otp/send-otp.command';
import { SendOtpHandler } from '@/modules/auth/application/otp/commands/send-otp/send-otp.handler';
import { IMailerPort } from '@/modules/auth/domain/auth/otp/interfaces/mailer.port';
import { IOtpRepository } from '@/modules/auth/domain/auth/otp/repositories/otp.repository.interface';
import { Otp } from '@/modules/auth/domain/auth/otp/entities/otp.entity';
import { IRoleRepository } from '@/modules/roles/domain/public-api';
import { Role } from '@/modules/roles/domain/entities/role.entity';
import { UserCreationPort } from '@/modules/users/application/public-api';
import { CreateUserCommand } from '@/modules/users/application/public-api';
import { IUserRepository } from '@/modules/users/domain/public-api';
import { User } from '@/modules/users/domain/users/entities/user.entity';
import { UserId } from '@/modules/users/domain/public-api';
import { IPasswordHasher } from '@/shared/domain/password-hasher.interface';

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

class FakeUserCreationPort extends UserCreationPort {
  override readonly create = jest.fn(
    (_command: CreateUserCommand): Promise<User> =>
      Promise.reject(new Error('Create user fake is not configured')),
  );
}

function createMockRoleRepository(): jest.Mocked<IRoleRepository> {
  return { findByName: jest.fn(), findById: jest.fn() };
}

class EmptyOtpRepository extends IOtpRepository {
  override save(_otp: Otp): Promise<void> {
    return Promise.resolve();
  }
  override findByEmail(_email: string): Promise<Otp | null> {
    return Promise.resolve(null);
  }
  override deleteByEmail(_email: string): Promise<void> {
    return Promise.resolve();
  }
  override checkRateLimit(_email: string): Promise<void> {
    return Promise.resolve();
  }
  override getTtl(_email: string): Promise<number> {
    return Promise.resolve(0);
  }
  override incrementVerifyAttempts(_email: string): Promise<number> {
    return Promise.resolve(0);
  }
  override clearVerifyAttempts(_email: string): Promise<void> {
    return Promise.resolve();
  }
}

class EmptyMailer extends IMailerPort {
  override sendMail(): Promise<void> {
    return Promise.resolve();
  }
}

class FakeSendOtpHandler extends SendOtpHandler {
  override execute = jest.fn((_command: SendOtpCommand): Promise<string> =>
    Promise.resolve('sent'),
  );

  constructor() {
    super(new EmptyOtpRepository(), new EmptyMailer());
  }
}

function createMockPasswordHasher(): jest.Mocked<IPasswordHasher> {
  return {
    hash: jest.fn((_password: string): Promise<string> => Promise.resolve('')),
    compare: jest.fn((_password: string, _hashed: string): Promise<boolean> =>
      Promise.resolve(false),
    ),
  };
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

describe('RegisterHandler (Unit)', () => {
  let useCase: RegisterHandler;
  let mockUserRepo: ReturnType<typeof createMockUserRepository>;
  let mockCreateUser: FakeUserCreationPort;
  let mockRoleRepository: jest.Mocked<IRoleRepository>;
  let mockSendOtp: FakeSendOtpHandler;
  let mockPasswordHasher: ReturnType<typeof createMockPasswordHasher>;

  beforeEach(() => {
    mockUserRepo = createMockUserRepository();
    mockCreateUser = new FakeUserCreationPort();
    mockRoleRepository = createMockRoleRepository();
    mockSendOtp = new FakeSendOtpHandler();
    mockPasswordHasher = createMockPasswordHasher();

    useCase = new RegisterHandler(
      mockUserRepo,
      mockRoleRepository,
      mockCreateUser,
      mockSendOtp,
      mockPasswordHasher,
    );
  });

  it('should register a new user successfully', async () => {
    mockUserRepo.findByEmail.mockResolvedValue(null);
    mockRoleRepository.findByName.mockResolvedValue(
      Role.create({ id: 'role-user', name: 'user' }),
    );
    mockCreateUser.create.mockResolvedValue(
      User.create({
        id: UserId.create('new-user'),
        roleId: 'role-user',
        username: 'newuser',
        email: 'newuser@example.com',
      }),
    );

    const result = await useCase.execute(
      new RegisterCommand('newuser@example.com', 'newuser', 'Password123!'),
    );

    expect(result).toBe('Mã OTP đã được gửi đến email của bạn');
    expect(mockCreateUser.create).toHaveBeenCalled();
    expect(mockSendOtp.execute).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'newuser@example.com' }),
    );
  });

  it('should resend OTP when existing user is not verified', async () => {
    const existingUser = createUnverifiedExistingUser();
    mockUserRepo.findByEmail.mockResolvedValue(existingUser);
    mockPasswordHasher.hash.mockResolvedValue('new-hash');
    mockUserRepo.save.mockResolvedValue(undefined);
    mockSendOtp.execute.mockResolvedValue('sent');

    const result = await useCase.execute(
      new RegisterCommand('existing@example.com', 'updateduser', 'NewPass123!'),
    );

    expect(result).toBe('Mã OTP đã được gửi đến email của bạn');
    expect(mockPasswordHasher.hash).toHaveBeenCalledWith('NewPass123!');
    expect(mockUserRepo.save).toHaveBeenCalled();
    expect(mockCreateUser.create).not.toHaveBeenCalled();
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
    mockRoleRepository.findByName.mockResolvedValue(null);

    await expect(
      useCase.execute(
        new RegisterCommand('newuser@example.com', 'newuser', 'Password123!'),
      ),
    ).rejects.toThrow(InternalServerErrorException);
  });

  it('should propagate errors from SendOtpUseCase', async () => {
    mockUserRepo.findByEmail.mockResolvedValue(null);
    mockRoleRepository.findByName.mockResolvedValue(
      Role.create({ id: 'role-user', name: 'user' }),
    );
    mockCreateUser.create.mockResolvedValue(
      User.create({
        id: UserId.create('new-user'),
        roleId: 'role-user',
        username: 'newuser',
        email: 'newuser@example.com',
      }),
    );
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
