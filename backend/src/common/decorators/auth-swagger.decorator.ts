import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiForbiddenResponse, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from './roles.decorator';

export function RequireAuth(...roles: string[]) {
  const decorators = [
    UseGuards(JwtAuthGuard),
    ApiBearerAuth(),
    ApiUnauthorizedResponse({ description: 'Chưa đăng nhập (Token hết hạn/Không hợp lệ)' }),
  ];

  if (roles.length > 0) {
    decorators.push(
      Roles(...roles),
      UseGuards(RolesGuard),
      ApiForbiddenResponse({ description: 'Không đủ quyền (Roles)' })
    );
  }

  return applyDecorators(...decorators);
}
