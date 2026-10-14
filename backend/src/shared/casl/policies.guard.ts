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
import { IS_PUBLIC_KEY } from '@/shared/platform/decorators/custom.decorator';

interface AuthenticatedRequest {
  actor?: Actor;
  user?: {
    id?: unknown;
    role?: unknown;
    roles?: unknown;
  };
}

function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.every((item: unknown) => typeof item === 'string')
  );
}

function readPrincipal(request: AuthenticatedRequest): AbilityPrincipal | null {
  const userId = request.user?.id;
  const role = request.user?.role;
  const roles = request.user?.roles;

  if (typeof userId !== 'string') return null;
  if (isStringArray(roles)) {
    return { userId, roles };
  }
  if (typeof role === 'string') return { userId, roles: [role] };
  return null;
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
    const principal = readPrincipal(request);
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!policy && !principal) return true;

    const actorPrincipal =
      principal ?? (isPublic ? { userId: 'anonymous', roles: [] } : null);
    if (!actorPrincipal) throw new ForbiddenException();

    const actor = this.abilityFactory.createActor(actorPrincipal);
    request.actor = actor;
    if (!policy) return true;

    const hasCoarsePermission = actor.ability
      .rulesFor(policy.action, policy.subject)
      .some((rule) => !rule.inverted);
    if (!hasCoarsePermission) throw new ForbiddenException();
    return true;
  }
}
