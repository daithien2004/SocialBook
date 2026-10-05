import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ValidateUserHandler } from '@/application/auth/use-cases/validate-user/validate-user.handler';
import { ValidateUserCommand } from '@/application/auth/use-cases/validate-user/validate-user.command';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private validateUserUseCase: ValidateUserHandler) {
    super({
      usernameField: 'email',
      passwordField: 'password',
    });
  }

  async validate(email: string, password: string): Promise<unknown> {
    const command = new ValidateUserCommand(email, password);
    const user = await this.validateUserUseCase.execute(command);
    if (!user) {
      throw new UnauthorizedException('Thông tin đăng nhập không chính xác');
    }
    return user;
  }
}
