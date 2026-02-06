import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LoginDto, SignupLocalDto } from './dto/auth.dto';

describe('AuthController', () => {
    let controller: AuthController;
    let authService: Partial<AuthService>;

    beforeEach(async () => {
        authService = {
            login: jest.fn().mockResolvedValue({
                accessToken: 'access',
                refreshToken: 'refresh',
                user: {} as any,
            }),
            signup: jest.fn().mockResolvedValue('otp_sent'),
        };

        const module: TestingModule = await Test.createTestingModule({
            controllers: [AuthController],
            providers: [
                { provide: AuthService, useValue: authService },
            ],
        }).compile();

        controller = module.get<AuthController>(AuthController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('login', () => {
        it('should return result from authService.login', async () => {
            const req = { user: { id: '1', email: 'test@example.com' } } as any;
            const loginDto: LoginDto = { email: 'test@example.com', password: 'password' };
            const result = await controller.login(req, loginDto);

            expect(authService.login).toHaveBeenCalledWith(req.user);
            expect(result).toEqual({
                accessToken: 'access',
                refreshToken: 'refresh',
                user: {},
            });
        });
    });

    describe('signup', () => {
        it('should return result from authService.signup', async () => {
            const dto: SignupLocalDto = {
                username: 'user',
                email: 'test@example.com',
                password: 'pass',
                confirmPassword: 'pass',
            };
            const result = await controller.signup(dto);

            expect(authService.signup).toHaveBeenCalledWith(dto);
            expect(result).toEqual('otp_sent');
        });
    });
});
