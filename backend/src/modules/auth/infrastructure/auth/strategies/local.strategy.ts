import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ValidateUserCommand } from '@/modules/auth/application/auth/commands/validate-user/validate-user.command';
import { AbilityFactory } from '@/shared/casl/ability.factory';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly abilityFactory: AbilityFactory,
  ) {
    super({
      usernameField: 'email',
      passwordField: 'password',
    });
  }

  async validate(email: string, password: string): Promise<unknown> {
    const actor = this.abilityFactory.createActor({
      userId: 'anonymous',
      roles: [],
    });
    const command = new ValidateUserCommand(actor, email, password);
    const user = await this.commandBus.execute(command);
    if (!user) {
      throw new UnauthorizedException('Thông tin đăng nhập không chính xác');
    }
    return user;
  }
}
