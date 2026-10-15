import { ExecutionContextHost } from '@nestjs/core/helpers/execution-context-host';
import { defineUserAbilities } from '@/modules/users/application/public-api';
import type { Actor } from '@/shared/casl/actor';
import { AbilityFactory } from '@/shared/casl/ability.factory';
import { AuthActorContextGuard } from '@/modules/auth/presentation/auth/guards/auth-actor-context.guard';

class TestController {
  handle(): void {}
}

describe('AuthActorContextGuard', () => {
  it('provides an anonymous actor when a public auth route has no actor', () => {
    const request: { actor?: Actor } = {};
    const context = new ExecutionContextHost(
      [request],
      TestController,
      TestController.prototype.handle,
    );
    const guard = new AuthActorContextGuard(
      new AbilityFactory([defineUserAbilities]),
    );

    expect(guard.canActivate(context)).toBe(true);
    expect(request.actor?.userId).toBe('anonymous');
    expect(request.actor?.roles).toEqual([]);
  });

  it('preserves an actor that was already attached to the request', () => {
    const existingActor = new AbilityFactory([defineUserAbilities]).createActor(
      { userId: 'user-1', roles: ['user'] },
    );
    const request: { actor?: Actor } = { actor: existingActor };
    const context = new ExecutionContextHost(
      [request],
      TestController,
      TestController.prototype.handle,
    );
    const guard = new AuthActorContextGuard(
      new AbilityFactory([defineUserAbilities]),
    );

    expect(guard.canActivate(context)).toBe(true);
    expect(request.actor).toBe(existingActor);
  });
});
