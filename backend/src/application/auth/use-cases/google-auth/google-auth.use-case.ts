import { Injectable, UnauthorizedException, ForbiddenException, ConflictException, InternalServerErrorException, Logger } from '@nestjs/common';
import { IUserRepository } from '@/domain/users/repositories/user.repository.interface';
import { CreateUserUseCase } from '@/application/users/use-cases/create-user/create-user.use-case';
import { CreateUserCommand } from '@/application/users/use-cases/create-user/create-user.command';
import { IRoleRepository } from '@/domain/roles/repositories/role.repository.interface';
import { UserEmail } from '@/domain/users/value-objects/user-email.vo';
import { TokenService } from '../../services/token.service';
import { GoogleAuthCommand } from './google-auth.command';

@Injectable()
export class GoogleAuthUseCase {
  private readonly logger = new Logger(GoogleAuthUseCase.name);

  constructor(
    private readonly userRepository: IUserRepository,
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly rolesRepository: IRoleRepository,
    private readonly tokenService: TokenService,
  ) { }

  async execute(command: GoogleAuthCommand) {
    try {
      const emailVO = UserEmail.create(command.email);
      const existingUser = await this.userRepository.findByEmail(emailVO);

      if (!existingUser) {
        const userRole = await this.rolesRepository.findByName('user');
        if (!userRole) {
          this.logger.error(
            'User role not found in database during Google signup - role may not be seeded',
          );
          throw new InternalServerErrorException(
            'Đã có lỗi xảy ra trong quá trình đăng ký',
          );
        }

        const createCommand = new CreateUserCommand(
          command.username || command.name || command.email.split('@')[0],
          command.email,
          undefined, // No password
          userRole.id.toString(),
          command.image,
          'google',
          command.googleId
        );
        const newUser = await this.createUserUseCase.execute(createCommand);
        // Verify automatically for Google
        newUser.verify();
        await this.userRepository.save(newUser);

        const tokens = await this.tokenService.signTokens(newUser.id.toString(), newUser.email.value, 'user');

        return {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          user: {
            id: newUser.id.toString(),
            email: newUser.email.value,
            username: newUser.username,
            image: newUser.image,
            role: 'user',
            onboardingCompleted: newUser.onboardingCompleted,
            onboardingId: undefined,
          },
        };
      }

      // Handle existing user login
      if (!existingUser.isVerified) {
        this.logger.warn(`Google login failed: Account not verified for ${command.email}`);
        throw new UnauthorizedException('Tài khoản chưa được xác thực');
      }

      if (existingUser.isBanned) {
        this.logger.warn(`Google login failed: Account banned for ${command.email}`);
        throw new ForbiddenException({
          statusCode: 403,
          message:
            'Tài khoản của bạn đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên.',
          error: 'USER_BANNED',
        });
      }

      if (existingUser.provider === 'local') {
        this.logger.warn(
          `Google login failed: Email already registered with password for ${command.email}`,
        );
        throw new ConflictException(
          'Email đã được đăng ký bằng mật khẩu. Vui lòng đăng nhập bằng mật khẩu hoặc liên kết tài khoản Google trước.',
        );
      }

      let roleName = 'user';
      if (existingUser.roleId) {
        const role = await this.rolesRepository.findById(existingUser.roleId);
        if (role) roleName = role.name;
      }

      const tokens = await this.tokenService.signTokens(
        existingUser.id.toString(),
        existingUser.email.value,
        roleName,
      );

      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: {
          id: existingUser.id.toString(),
          email: existingUser.email.value,
          username: existingUser.username,
          image: existingUser.image,
          role: roleName,
          onboardingCompleted: existingUser.onboardingCompleted,
          onboardingId: undefined,
        },
      };
    } catch (error) {
      if (
        error instanceof UnauthorizedException ||
        error instanceof ForbiddenException ||
        error instanceof ConflictException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }
      this.logger.error(`Unexpected error during Google login for ${command.email}: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Đã có lỗi xảy ra khi đăng nhập bằng Google');
    }
  }
}
