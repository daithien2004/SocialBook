import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Request } from 'express';
import * as crypto from 'crypto';

@Injectable()
export class CsrfGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    
    // Bỏ qua các method an toàn (không thay đổi trạng thái)
    if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
      return true;
    }

    const csrfSecret = request.cookies['sb_csrf_secret'];
    const csrfHeader = request.headers['x-csrf-token'];

    if (!csrfSecret || !csrfHeader) {
      throw new ForbiddenException('Missing CSRF tokens');
    }

    const expectedToken = crypto
      .createHmac('sha256', process.env.JWT_ACCESS_SECRET || 'fallback_secret')
      .update(csrfSecret)
      .digest('hex');

    if (csrfHeader !== expectedToken) {
      throw new ForbiddenException('Invalid CSRF token signature');
    }

    return true;
  }
}
