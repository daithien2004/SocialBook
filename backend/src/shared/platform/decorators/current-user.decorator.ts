import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<{
      user?: Record<string, unknown>;
    }>();
    const user = request.user;
    return data ? user?.[data] : user;
  },
);
