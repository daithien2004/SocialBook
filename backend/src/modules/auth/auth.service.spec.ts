import { ConflictException, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { OtpService } from '../otp/otp.service';
import { RolesRepository } from '../roles/roles.repository';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
    let service: AuthService;
    let usersService: Partial<UsersService>;
    let jwtService: Partial<JwtService>;
    let configService: Partial<ConfigService>;
    let otpService: Partial<OtpService>;
    let rolesRepository: Partial<RolesRepository>;

    beforeEach(async () => {
        usersService = {
            findById: jest.fn(),
            findByEmail: jest.fn(),
            create: jest.fn(),
            updateRefreshToken: jest.fn(),
        };
        jwtService = {
            signAsync: jest.fn().mockResolvedValue('token'),
        };
        configService = {
            get: jest.fn((key: string) => {
                if (key === 'env.JWT_ACCESS_SECRET') return 'access_secret';
                if (key === 'env.JWT_REFRESH_SECRET') return 'refresh_secret';
                return null;
            }),
        };
        otpService = {
            generateOTP: jest.fn().mockResolvedValue('123456'),
        };
        rolesRepository = {
            findByName: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                { provide: UsersService, useValue: usersService },
                { provide: JwtService, useValue: jwtService },
                { provide: ConfigService, useValue: configService },
                { provide: OtpService, useValue: otpService },
                { provide: RolesRepository, useValue: rolesRepository },
            ],
        }).compile();

        service = module.get<AuthService>(AuthService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('login', () => {
        it('should return tokens and user info on valid login', async () => {
            const mockUser = {
                id: 'userId',
                email: 'test@example.com',
                username: 'testuser',
                image: 'image.png',
                isVerified: true,
                isBanned: false,
                onboardingCompleted: true,
                roleId: { name: 'user' },
            } as any;

            (usersService.findById as jest.Mock).mockResolvedValue(mockUser);

            const result = await service.login(mockUser);

            expect(result).toHaveProperty('accessToken');
            expect(result).toHaveProperty('refreshToken');
            expect(result.user.email).toEqual(mockUser.email);
            expect(jwtService.signAsync).toHaveBeenCalledTimes(2);
        });

        it('should throw UnauthorizedException if user is not verified', async () => {
            const mockUser = {
                id: 'userId',
                isVerified: false,
            } as any;

            await expect(service.login(mockUser)).rejects.toThrow(UnauthorizedException);
        });

        it('should throw ForbiddenException if user is banned', async () => {
            const mockUser = {
                id: 'userId',
                isVerified: true,
                isBanned: true,
            } as any;

            await expect(service.login(mockUser)).rejects.toThrow(ForbiddenException);
        });
    });

    describe('signup', () => {
        it('should create new user and return otp if email not exists', async () => {
            const dto = {
                username: 'newuser',
                email: 'new@example.com',
                password: 'password',
                confirmPassword: 'password',
            };

            (usersService.findByEmail as jest.Mock).mockResolvedValue(null);
            (rolesRepository.findByName as jest.Mock).mockResolvedValue({ _id: 'roleId' });
            (usersService.create as jest.Mock).mockResolvedValue({});

            const result = await service.signup(dto);

            expect(usersService.create).toHaveBeenCalled();
            expect(otpService.generateOTP).toHaveBeenCalledWith(dto.email);
            expect(result).toEqual('123456');
        });

        it('should return otp if user exists but not verified', async () => {
            const dto = {
                username: 'existing',
                email: 'existing@example.com',
                password: 'password',
                confirmPassword: 'password',
            };
            const existingUser = { isVerified: false };
            (usersService.findByEmail as jest.Mock).mockResolvedValue(existingUser);

            const result = await service.signup(dto);

            expect(otpService.generateOTP).toHaveBeenCalledWith(dto.email);
            expect(result).toEqual('123456');
        });

        it('should throw ConflictException if user exists and verified', async () => {
            const dto = {
                username: 'verified',
                email: 'verified@example.com',
                password: 'password',
                confirmPassword: 'password',
            };
            const existingUser = { isVerified: true };
            (usersService.findByEmail as jest.Mock).mockResolvedValue(existingUser);

            await expect(service.signup(dto)).rejects.toThrow(ConflictException);
        });
    });
});
