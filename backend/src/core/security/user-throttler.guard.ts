import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

@Injectable()
export class UserThrottlerGuard extends ThrottlerGuard {
  protected override getTracker(
    request: Record<string, unknown>,
  ): Promise<string> {
    const user = request.user;
    if (isRecord(user) && typeof user.id === 'string' && user.id.length > 0) {
      return Promise.resolve(`user:${user.id}`);
    }

    const ip = request.ip;
    return Promise.resolve(
      typeof ip === 'string' && ip.length > 0 ? `ip:${ip}` : 'ip:unknown',
    );
  }
}
