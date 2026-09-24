import { UnauthorizedDomainException } from '@/domain/auth/exceptions/auth-exceptions';
import { Inject, Injectable } from '@nestjs/common';
import { IPasswordHasher } from '@/shared/domain/password-hasher.interface';
import { IUserRepository } from '@/domain/users/repositories/user.repository.interface';
import { UserId } from '@/domain/users/value-objects/user-id.vo';
import { IRoleRepository } from '@/domain/roles/repositories/role.repository.interface';
import { TokenService } from '../../services/token.service';
import { TokenRotationPort } from '@/application/ports/token-rotation.port';
import { RefreshTokenCommand } from './refresh-token.command';

// Tokens mới được giữ lâu hơn lock để các request ăn kè kịp đọc.
const FRESH_TOKENS_TTL_SECONDS = 10;

@Injectable()
export class RefreshTokenUseCase {
  private readonly GRACE_MS = 30_000;

  constructor(
    private readonly userRepository: IUserRepository,
    private readonly rolesRepository: IRoleRepository,
    private readonly tokenService: TokenService,
    private readonly passwordHasher: IPasswordHasher,
    @Inject(TokenRotationPort)
    private readonly rotationPort: TokenRotationPort,
  ) {}

  async execute(command: RefreshTokenCommand) {
    const { userId, refreshToken } = command;

    // Chỉ 1 request xoay vòng; các request song song ăn kè kết quả từ cache.
    // Kẻ thua KHÔNG so sánh lại hash (hash cũ đã bị winner ghi đè) — chỉ đọc cache.
    const hasLock = await this.rotationPort.tryAcquireLock(userId);
    if (!hasLock) {
      const fresh = await this.rotationPort.readFreshTokens(userId);
      if (fresh) return fresh;
      throw new UnauthorizedDomainException('Từ chối truy cập');
    }

    try {
      const id = UserId.create(userId);
      const user = await this.userRepository.findById(id);
      if (!user || !user.hashedRt) {
        throw new UnauthorizedDomainException('Từ chối truy cập');
      }

      const curMatches = await this.passwordHasher.compare(
        refreshToken,
        user.hashedRt,
      );

      if (curMatches) {
        // Xoay vòng hợp lệ: giữ hash cũ làm previous để chống reuse trong grace.
        const prevHash = user.hashedRt;
        user.updatePreviousHashedRt(prevHash);
        user.updateRefreshRotatedAt(new Date());
        await this.userRepository.save(user);

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
        await this.rotationPort.writeFreshTokens(
          userId,
          tokens,
          FRESH_TOKENS_TTL_SECONDS,
        );
        return tokens;
      }

      // Grace-path: reuse của request song song — chỉ cấp lại access, KHÔNG xoay refresh.
      const prevMatches = user.previousHashedRt
        ? await this.passwordHasher.compare(refreshToken, user.previousHashedRt)
        : false;
      const rotatedAt = user.refreshRotatedAt;
      const withinGrace =
        !!rotatedAt && Date.now() - rotatedAt.getTime() <= this.GRACE_MS;
      if (prevMatches && withinGrace) {
        const roleName = user.roleId
          ? ((await this.rolesRepository.findById(user.roleId))?.name ?? 'user')
          : 'user';
        const accessToken = await this.tokenService.signAccessOnly(
          user.id.toString(),
          user.email.value,
          roleName,
        );
        return { accessToken, refreshToken };
      }

      // Reuse ngoài grace / token lạ → thu hồi cả family.
      user.updateHashedRt(null);
      user.updatePreviousHashedRt(null);
      user.updateRefreshRotatedAt(null);
      await this.userRepository.save(user);
      await this.rotationPort.revokeAll(userId);
      throw new UnauthorizedDomainException('Từ chối truy cập');
    } finally {
      await this.rotationPort.releaseLock(userId);
    }
  }
}
