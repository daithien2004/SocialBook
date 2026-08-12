import { UnauthorizedDomainException } from '@/domain/auth/exceptions/auth-exceptions';
import { Injectable } from '@nestjs/common';
import { IPasswordHasher } from '@/shared/domain/password-hasher.interface';
import { IUserRepository } from '@/domain/users/repositories/user.repository.interface';
import { UserId } from '@/domain/users/value-objects/user-id.vo';
import { TokenService } from '../../services/token.service';
import { IRoleRepository } from '@/domain/roles/repositories/role.repository.interface';
import { RefreshTokenCommand } from './refresh-token.command';

@Injectable()
export class RefreshTokenUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly rolesRepository: IRoleRepository,
    private readonly tokenService: TokenService,
    private readonly passwordHasher: IPasswordHasher,
  ) {}

  async execute(command: RefreshTokenCommand) {
    const { userId, refreshToken } = command;
    const id = UserId.create(userId);
    const user = await this.userRepository.findById(id);

    if (!user || !user.hashedRt) {
      throw new UnauthorizedDomainException('Từ chối truy cập');
    }
    const rtMatches = await this.passwordHasher.compare(
      refreshToken,
      user.hashedRt,
    );
    if (!rtMatches) {
      throw new UnauthorizedDomainException('Từ chối truy cập');
    }

    let roleName = 'user';
    if (user.roleId) {
      const role = await this.rolesRepository.findById(user.roleId);
      if (role) roleName = role.name;
    }
    return this.tokenService.signTokens(
      user.id.toString(),
      user.email.value,
      roleName,
    );
  }
}
