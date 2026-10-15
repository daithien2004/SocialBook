import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { AbilityFactory } from '@/shared/casl/ability.factory';
import type { Actor } from '@/shared/casl/actor';

interface RequestWithActor {
  actor?: Actor;
}

@Injectable()
export class AuthActorContextGuard implements CanActivate {
  constructor(private readonly abilityFactory: AbilityFactory) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithActor>();
    request.actor ??= this.abilityFactory.createActor({
      userId: 'anonymous',
      roles: [],
    });
    return true;
  }
}
