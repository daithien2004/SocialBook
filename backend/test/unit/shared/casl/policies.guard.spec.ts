import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ExecutionContextHost } from '@nestjs/core/helpers/execution-context-host';
import { defineReadingRoomAbilities } from '@/modules/reading-rooms/application/policies/reading-room.ability';
import { AbilityFactory } from '@/shared/casl/ability.factory';
import { CheckPolicy } from '@/shared/casl/check-policy.decorator';
import { PoliciesGuard } from '@/shared/casl/policies.guard';
import type { JwtValidatedUser } from '@/shared/platform/interfaces/jwt-validated-user.interface';

class PolicyController {
  @CheckPolicy('read', 'ReadingRoom')
  readRoom(): void {}

  @CheckPolicy('delete', 'ReadingRoom')
  deleteRoom(): void {}

  unprotectedRoute(): void {}
}

describe('PoliciesGuard', () => {
  const guard = new PoliciesGuard(
    new Reflector(),
    new AbilityFactory([defineReadingRoomAbilities]),
  );

  function contextFor(
    method: keyof PolicyController,
    request: { user?: JwtValidatedUser; actor?: { userId: string } },
  ): ExecutionContextHost {
    const handler = PolicyController.prototype[method];
    return new ExecutionContextHost([request], PolicyController, handler);
  }

  it('allows a request with coarse permission for the declared policy', () => {
    const context = contextFor('readRoom', {
      user: { id: 'user-1', email: 'user@example.com', roles: ['member'] },
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('leaves authentication of missing users to the authentication guard', () => {
    const context = contextFor('readRoom', {});

    expect(guard.canActivate(context)).toBe(true);
  });

  it('rejects a principal without the declared action', () => {
    const context = contextFor('deleteRoom', {
      user: { id: 'user-1', email: 'user@example.com', roles: ['member'] },
    });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('does not create an actor when the request has no authenticated user', () => {
    const request: {
      user?: JwtValidatedUser;
      actor?: { userId: string };
    } = {};
    const context = contextFor('readRoom', request);

    expect(guard.canActivate(context)).toBe(true);
    expect(request.actor).toBeUndefined();
  });

  it('does not affect routes without policy metadata', () => {
    const context = contextFor('unprotectedRoute', {});

    expect(guard.canActivate(context)).toBe(true);
  });
});
