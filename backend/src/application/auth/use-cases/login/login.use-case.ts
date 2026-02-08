
import { Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { TokenService } from '../../services/token.service';
import { IRoleRepository } from '@/domain/roles/repositories/role.repository.interface';

@Injectable()
export class LoginUseCase {
  constructor(
    private readonly tokenService: TokenService,
    private readonly rolesRepository: IRoleRepository,
  ) {}

  async execute(user: any) {
    if (!user) {
      throw new UnauthorizedException('Người dùng không tồn tại');
    }

    if (!user.isVerified) {
      throw new UnauthorizedException('Tài khoản chưa được xác thực');
    }
    
    // Check banned status again just in case (already checked in ValidateUser but good for safety)
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
        onboardingId: undefined, // Add logic if needed
      },
    };
  }
}
