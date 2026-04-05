import { applyDecorators, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from './roles.decorator';

export function RequireAuth(...roles: string[]) {
  const decorators = [UseGuards(JwtAuthGuard)];

  if (roles.length > 0) {
    decorators.push(Roles(...roles), UseGuards(RolesGuard));
  }

  return applyDecorators(...decorators);
}
