import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ExecutionContextHost } from '@nestjs/core/helpers/execution-context-host';
import { defineReadingRoomAbilities } from '@/modules/reading-rooms/application/policies/reading-room.ability';
import { AbilityFactory } from '@/shared/casl/ability.factory';
import { CheckPolicy } from '@/shared/casl/check-policy.decorator';
import { PoliciesGuard } from '@/shared/casl/policies.guard';
import { Public } from '@/shared/platform/decorators/custom.decorator';

class PolicyController {
  @CheckPolicy('read', 'ReadingRoom')
  readRoom(): void {}

  @CheckPolicy('delete', 'ReadingRoom')
  deleteRoom(): void {}

  @Public()
  @CheckPolicy('read', 'ReadingRoom')
  publicReadRoom(): void {}

  unprotectedRoute(): void {}
}

describe('PoliciesGuard', () => {
  const guard = new PoliciesGuard(
    new Reflector(),
    new AbilityFactory([defineReadingRoomAbilities]),
  );

  function contextFor(
    method: keyof PolicyController,
    request: { user?: { id?: unknown; role?: unknown; roles?: unknown } },
  ): ExecutionContextHost {
    const handler = PolicyController.prototype[method];
    return new ExecutionContextHost([request], PolicyController, handler);
  }

  it('allows a request with coarse permission for the declared policy', () => {
    const context = contextFor('readRoom', {
      user: { id: 'user-1', role: 'member' },
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('rejects requests without a validated principal', () => {
    const context = contextFor('readRoom', {
      user: { id: 42, role: 'member' },
    });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('rejects a principal without the declared action', () => {
    const context = contextFor('deleteRoom', {
      user: { id: 'user-1', role: 'member' },
    });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('attaches an anonymous actor to public routes with a read policy', () => {
    const request: {
      user?: { id?: unknown; role?: unknown; roles?: unknown };
      actor?: { userId: string };
    } = {};
    const context = contextFor('publicReadRoom', request);

    expect(guard.canActivate(context)).toBe(true);
    expect(request.actor?.userId).toBe('anonymous');
  });

  it('does not affect routes without policy metadata', () => {
    const context = contextFor('unprotectedRoute', {});

    expect(guard.canActivate(context)).toBe(true);
  });
});
