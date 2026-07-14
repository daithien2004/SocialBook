import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  ValidationPipe,
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import request from 'supertest';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';

import { AuthController } from '@/presentation/auth/auth.controller';
import { TransformInterceptor } from '@/common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from '@/common/filters/http-exception.filter';
import { LoginUseCase } from '@/application/auth/use-cases/login/login.use-case';
import { RegisterUseCase } from '@/application/auth/use-cases/register/register.use-case';
import { GoogleAuthUseCase } from '@/application/auth/use-cases/google-auth/google-auth.use-case';
import { RefreshTokenUseCase } from '@/application/auth/use-cases/refresh-token/refresh-token.use-case';
import { LogoutUseCase } from '@/application/auth/use-cases/logout/logout.use-case';
import { ForgotPasswordUseCase } from '@/application/auth/use-cases/forgot-password/forgot-password.use-case';
import { ResetPasswordUseCase } from '@/application/auth/use-cases/reset-password/reset-password.use-case';
import { VerifyOtpUseCase } from '@/application/auth/use-cases/verify-otp/verify-otp.use-case';
import { ResendOtpUseCase } from '@/application/auth/use-cases/resend-otp/resend-otp.use-case';
import { LocalAuthGuard } from '@/common/guards/local-auth.guard';
import { JwtRefreshAuthGuard } from '@/common/guards/jwt-refresh-auth.guard';

@Injectable()
class MockGuard implements CanActivate {
  canActivate(_context: ExecutionContext): boolean {
    return true;
  }
}

const mockExecute = jest.fn().mockResolvedValue(undefined);

describe('Auth API (E2E)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvFile: true,
          load: [
            () => ({
              JWT_ACCESS_SECRET:
                'test-jwt-secret-for-e2e-test-at-least-32-chars',
              JWT_REFRESH_SECRET: 'test-refresh-secret',
              ACCESS_TOKEN_EXPIRES_IN: '15m',
              REFRESH_TOKEN_EXPIRES_IN: '7d',
              FRONTEND_URL: 'http://localhost:3000',
            }),
          ],
        }),
        PassportModule,
      ],
      controllers: [AuthController],
      providers: [
        Reflector,
        {
          provide: 'CACHE_SERVICE',
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
            reset: jest.fn(),
          },
        },
        { provide: LoginUseCase, useValue: { execute: mockExecute } },
        { provide: RegisterUseCase, useValue: { execute: mockExecute } },
        { provide: GoogleAuthUseCase, useValue: { execute: mockExecute } },
        { provide: RefreshTokenUseCase, useValue: { execute: mockExecute } },
        { provide: LogoutUseCase, useValue: { execute: mockExecute } },
        { provide: ForgotPasswordUseCase, useValue: { execute: mockExecute } },
        { provide: ResetPasswordUseCase, useValue: { execute: mockExecute } },
        { provide: VerifyOtpUseCase, useValue: { execute: mockExecute } },
        { provide: ResendOtpUseCase, useValue: { execute: mockExecute } },
      ],
    })
      .overrideGuard(LocalAuthGuard)
      .useClass(MockGuard)
      .overrideGuard(JwtRefreshAuthGuard)
      .useClass(MockGuard)
      .compile();

    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    app.setGlobalPrefix('api');
    app.useGlobalInterceptors(new TransformInterceptor());
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('DTO validation', () => {
    describe('POST /api/auth/signup', () => {
      it('should reject weak password', async () => {
        const res = await request(app.getHttpServer())
          .post('/api/auth/signup')
          .send({
            username: 'test',
            email: 'test@test.com',
            password: '123',
            confirmPassword: '123',
          })
          .expect(400);
        expect(res.body).toHaveProperty('message');
      });

      it('should reject invalid email', async () => {
        await request(app.getHttpServer())
          .post('/api/auth/signup')
          .send({
            username: 'test',
            email: 'bad',
            password: 'Password123!',
            confirmPassword: 'Password123!',
          })
          .expect(400);
      });

      it('should reject missing fields', async () => {
        await request(app.getHttpServer())
          .post('/api/auth/signup')
          .send({})
          .expect(400);
      });

      it('should accept valid payload', async () => {
        mockExecute.mockResolvedValue('Mã OTP đã được gửi đến email của bạn');
        const res = await request(app.getHttpServer())
          .post('/api/auth/signup')
          .send({
            username: 'validuser',
            email: 'valid@test.com',
            password: 'Password123!',
            confirmPassword: 'Password123!',
          })
          .expect(201);
        expect(res.body.message).toContain('OTP');
      });
    });

    describe('POST /api/auth/login', () => {
      it('should reject missing fields', async () => {
        await request(app.getHttpServer())
          .post('/api/auth/login')
          .send({})
          .expect(400);
      });

      it('should reject invalid email', async () => {
        await request(app.getHttpServer())
          .post('/api/auth/login')
          .send({ email: 'bad', password: 'Password123!' })
          .expect(400);
      });
    });

    describe('POST /api/auth/forgot-password', () => {
      it('should reject missing email', async () => {
        await request(app.getHttpServer())
          .post('/api/auth/forgot-password')
          .send({})
          .expect(400);
      });

      it('should accept valid email', async () => {
        await request(app.getHttpServer())
          .post('/api/auth/forgot-password')
          .send({ email: 'test@test.com' })
          .expect(201);
      });
    });

    describe('POST /api/auth/reset-password', () => {
      it('should reject missing fields', async () => {
        await request(app.getHttpServer())
          .post('/api/auth/reset-password')
          .send({})
          .expect(400);
      });

      it('should accept valid payload', async () => {
        mockExecute.mockResolvedValue('Đặt lại mật khẩu thành công');
        const res = await request(app.getHttpServer())
          .post('/api/auth/reset-password')
          .send({
            email: 'test@test.com',
            otp: '123456',
            newPassword: 'NewPass123!',
          })
          .expect(201);
        expect(res.body).toHaveProperty('message');
      });
    });

    describe('POST /api/auth/verify-otp', () => {
      it('should reject missing fields', async () => {
        await request(app.getHttpServer())
          .post('/api/auth/verify-otp')
          .send({})
          .expect(400);
      });

      it('should accept valid payload', async () => {
        mockExecute.mockResolvedValue('Xác thực thành công');
        await request(app.getHttpServer())
          .post('/api/auth/verify-otp')
          .send({ email: 'test@test.com', otp: '123456' })
          .expect(201);
      });
    });

    describe('POST /api/auth/resend-otp', () => {
      it('should reject missing email', async () => {
        await request(app.getHttpServer())
          .post('/api/auth/resend-otp')
          .send({})
          .expect(400);
      });
    });

    describe('POST /api/auth/refresh', () => {
      it('should reject missing refreshToken', async () => {
        await request(app.getHttpServer())
          .post('/api/auth/refresh')
          .send({})
          .expect(400);
      });
    });
  });

  describe('Response format', () => {
    it('should wrap data in envelope via TransformInterceptor', async () => {
      mockExecute.mockResolvedValue('Mã OTP đã được gửi đến email của bạn');
      const res = await request(app.getHttpServer())
        .post('/api/auth/signup')
        .send({
          username: 'format',
          email: 'format@test.com',
          password: 'Password123!',
          confirmPassword: 'Password123!',
        })
        .expect(201);
      expect(res.body).toHaveProperty('success');
      expect(res.body).toHaveProperty('statusCode');
      expect(res.body).toHaveProperty('timestamp');
      expect(res.body).toHaveProperty('path');
    });

    it('should return consistent error shape on validation failure', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/signup')
        .send({})
        .expect(400);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body).toHaveProperty('statusCode', 400);
      expect(res.body).toHaveProperty('message');
    });
  });

  describe('Error handling', () => {
    it('should handle 404 for unknown routes', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/auth/nonexistent')
        .expect(404);
      expect(res.body).toHaveProperty('statusCode', 404);
    });
  });
});
