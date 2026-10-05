import { OAuthAuthCommand } from './oauth-auth.command';
import { CommandHandler } from '@nestjs/cqrs';
import {
  ConflictException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import {
  UnauthorizedDomainException,
  UserBannedDomainException,
} from '@/domain/auth/exceptions/auth-exceptions';
import { IUserRepository } from '@/domain/users/repositories/user.repository.interface';
import { IRoleRepository } from '@/domain/roles/repositories/role.repository.interface';
import { UserEmail } from '@/domain/users/value-objects/user-email.vo';
import { CreateUserCommand } from '@/application/users/commands/create-user/create-user.command';
import { CreateUserHandler } from '@/application/users/commands/create-user/create-user.handler';
import { TokenService } from '../../services/token.service';

@CommandHandler(OAuthAuthCommand)
export class OAuthAuthHandler {
  private readonly logger = new Logger(OAuthAuthHandler.name);

  constructor(
    private readonly userRepository: IUserRepository,
    private readonly createUserUseCase: CreateUserHandler,
    private readonly rolesRepository: IRoleRepository,
    private readonly tokenService: TokenService,
  ) {}

  async execute(command: OAuthAuthCommand) {
    const p = command.profile;
    if (!p.emailVerified) {
      this.logger.warn(`OAuth login failed: email not verified for ${p.email}`);
      throw new UnauthorizedDomainException(
        'Email chưa được xác thực bởi nhà cung cấp',
      );
    }

    const emailVO = UserEmail.create(p.email);
    const existingUser = await this.userRepository.findByEmail(emailVO);

    if (!existingUser) {
      const userRole = await this.rolesRepository.findByName('user');
      if (!userRole) {
        this.logger.error(
          'User role not found in database during OAuth signup - role may not be seeded',
        );
        throw new InternalServerErrorException(
          'Đã có lỗi xảy ra trong quá trình đăng ký',
        );
      }
      const createCommand = new CreateUserCommand(
        p.name || p.email.split('@')[0],
        p.email,
        undefined,
        userRole.id.toString(),
        p.image,
        p.provider,
        p.providerId,
      );
      const newUser = await this.createUserUseCase.execute(createCommand);
      newUser.verify();
      await this.userRepository.save(newUser);

      const tokens = await this.tokenService.signTokens(
        newUser.id.toString(),
        newUser.email.value,
        'user',
        newUser.username,
        newUser.image,
      );

      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: {
          id: newUser.id.toString(),
          email: newUser.email.value,
          username: newUser.username,
          image: newUser.image,
          role: 'user',
        },
      };
    }

    if (!existingUser.isVerified) {
      this.logger.warn(
        `OAuth login failed: Account not verified for ${p.email}`,
      );
      throw new UnauthorizedDomainException('Tài khoản chưa được xác thực');
    }
    if (existingUser.isBanned) {
      this.logger.warn(`OAuth login failed: Account banned for ${p.email}`);
      throw new UserBannedDomainException(
        'Tài khoản của bạn đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên.',
      );
    }
    if (existingUser.provider === 'local') {
      this.logger.warn(
        `OAuth login failed: Email already registered with password for ${p.email}`,
      );
      throw new ConflictException(
        'Email đã được đăng ký bằng mật khẩu. Vui lòng đăng nhập bằng mật khẩu.',
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
      existingUser.username,
      existingUser.image,
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
      },
    };
  }
}
