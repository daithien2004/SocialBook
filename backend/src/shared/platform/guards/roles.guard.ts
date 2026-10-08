// Shared authorization guard for HTTP routes.
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { Action, Subject, canAccess, defineRulesFor } from '@socialbook/shared';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<string[] | undefined>(
      'roles',
      [context.getHandler(), context.getClass()],
    );

    if (roles === undefined) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{
      user?: { role?: string };
    }>();
    const ability = defineRulesFor(request.user?.role ?? '');
    return canAccess(ability, Action.Manage, Subject.All);
  }
}
