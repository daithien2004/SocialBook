import { Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { TokenService } from '../../services/token.service';
import { IRoleRepository } from '@/domain/roles/repositories/role.repository.interface';
import { LoginCommand } from './login.command';
import { User } from '@/domain/users/entities/user.entity';

@Injectable()
export class LoginUseCase {
  constructor(
    private readonly tokenService: TokenService,
    private readonly rolesRepository: IRoleRepository,
  ) { }

  async execute(command: LoginCommand) {
    const user = command.user as User;

    if (!user) {
      throw new UnauthorizedException('Người dùng không tồn tại');
    }

    if (!user.isVerified) {
      throw new UnauthorizedException('Tài khoản chưa được xác thực');
    }

    if (user.isBanned) {
      throw new ForbiddenException({
        statusCode: 403,
        message: 'Tài khoản của bạn đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên.',
        error: 'USER_BANNED',
      });
    }

    let roleName = 'user';
    if (user.roleId) {
      const role = await this.rolesRepository.findById(user.roleId);
      if (role) roleName = role.name;
    }

    const tokens = await this.tokenService.signTokens(
      user.id.toString(),
      user.email.value,
      roleName,
    );

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id.toString(),
        email: user.email.value,
        username: user.username,
        image: user.image,
        role: roleName,
        onboardingCompleted: user.onboardingCompleted,
      },
    };
  }
}
