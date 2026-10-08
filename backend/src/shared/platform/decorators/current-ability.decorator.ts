import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { defineRulesFor, AppAbility } from '@socialbook/shared';

export const CurrentAbility = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): AppAbility => {
    const request = ctx.switchToHttp().getRequest<{
      user?: { id: string; role: string; [key: string]: unknown };
    }>();
    const user = request.user;

    if (!user) {
      return defineRulesFor('');
    }

    return defineRulesFor(user.role, user.id);
  },
);
