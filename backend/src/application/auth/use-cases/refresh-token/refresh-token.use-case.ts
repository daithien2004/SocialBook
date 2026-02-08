
import { Injectable, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { IUserRepository } from '@/domain/users/repositories/user.repository.interface';
import { UserId } from '@/domain/users/value-objects/user-id.vo';
import { TokenService } from '../../services/token.service';
import { IRoleRepository } from '@/domain/roles/repositories/role.repository.interface';

@Injectable()
export class RefreshTokenUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly rolesRepository: IRoleRepository,
    private readonly tokenService: TokenService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async execute(userId: string, refreshToken: string) {
    const id = UserId.create(userId);
    const user = await this.userRepository.findById(id);
    
    if (!user || !user.hashedRt) {
      throw new ForbiddenException('Từ chối truy cập');
    }
    const rtMatches = await bcrypt.compare(refreshToken, user.hashedRt);
    if (!rtMatches) {
      throw new ForbiddenException('Từ chối truy cập');
    }

    let roleName = 'user';
    if (user.roleId) {
        const role = await this.rolesRepository.findById(user.roleId);
        if (role) roleName = role.name;
    }
    return this.tokenService.signTokens(user.id.toString(), user.email.value, roleName);
  }

  async validateRefreshToken(token: string) {
     try {
       const payload = this.jwtService.verify(token, {
         secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
       });
 
       // Check DB
       const id = UserId.create(payload.sub);
       const user = await this.userRepository.findById(id);
       if (!user || !user.hashedRt) return false;
 
       const isMatch = await bcrypt.compare(token, user.hashedRt);
       
       if (!isMatch) {
          throw new UnauthorizedException('Refresh token không hợp lệ');
       }
 
       return payload;
     } catch (error) {
       throw new UnauthorizedException('Refresh token không hợp lệ');
     }
  }
}
