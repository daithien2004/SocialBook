import {
  createParamDecorator,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import type { Actor } from '@/shared/casl/actor';

interface ActorRequest {
  actor?: Actor;
}

export const CurrentActor = createParamDecorator(
  (_data: unknown, context: ExecutionContext): Actor => {
    const actor = context.switchToHttp().getRequest<ActorRequest>().actor;
    if (!actor) throw new ForbiddenException();
    return actor;
  },
);
