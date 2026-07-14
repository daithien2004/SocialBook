import { applyDecorators, UseGuards } from '@nestjs/common';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from './roles.decorator';

export function RequireAuth(...roles: string[]) {
  const decorators: (MethodDecorator | ClassDecorator)[] = [];

  if (roles.length > 0) {
    decorators.push(Roles(...roles), UseGuards(RolesGuard));
  }

  return applyDecorators(...decorators);
}
