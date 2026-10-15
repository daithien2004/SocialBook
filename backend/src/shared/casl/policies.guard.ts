import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Actor } from './actor';
import type { AbilityPrincipal } from './ability.factory';
import type { CheckPolicyMetadata } from './check-policy.decorator';
import { CHECK_POLICY } from './check-policy.decorator';
import { AbilityFactory } from './ability.factory';
import type { JwtValidatedUser } from '@/shared/platform/interfaces/jwt-validated-user.interface';

interface AuthenticatedRequest {
  actor?: Actor;
  user?: JwtValidatedUser;
}

function readPrincipal(
  user: JwtValidatedUser | undefined,
): AbilityPrincipal | null {
  if (!user) return null;
  return { userId: user.id, roles: user.roles };
}

@Injectable()
export class PoliciesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly abilityFactory: AbilityFactory,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const policy = this.reflector.getAllAndOverride<
      CheckPolicyMetadata | undefined
    >(CHECK_POLICY, [context.getHandler(), context.getClass()]);

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const principal = readPrincipal(request.user);
    if (!principal) return true;

    const actor = this.abilityFactory.createActor(principal);
    request.actor = actor;
    if (!policy) return true;

    const hasMatchingAllowRule = actor.ability
      .rulesFor(policy.action, policy.subject)
      .some((rule) => !rule.inverted);
    if (!hasMatchingAllowRule) throw new ForbiddenException();
    return true;
  }
}
