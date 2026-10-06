import {
  CanActivate,
  ExecutionContext,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { WsRateLimiter } from './ws-rate-limiter.service';
import { RateLimitDomainException } from '@/shared/domain/common-exceptions';
import { RoomSocket } from '../reading-room/reading-room.types';

const THROTTLE_OPTIONS_KEY = 'ws_throttle_options';

export interface WsThrottleOptions {
  event: string;
  limit: number;
}

export const WsThrottle = (options: WsThrottleOptions) =>
  SetMetadata(THROTTLE_OPTIONS_KEY, options);

@Injectable()
export class WsThrottleGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly rateLimiter: WsRateLimiter,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const options = this.reflector.get<WsThrottleOptions | undefined>(
      THROTTLE_OPTIONS_KEY,
      context.getHandler(),
    );

    if (!options) {
      return true;
    }

    const ctx = context.switchToWs();
    const client = ctx.getClient<RoomSocket>();
    const sd = client.data;
    const userId = sd.userId;

    if (!userId) {
      return true; // Let auth guard handle unauthorized users
    }

    const isLimited = await this.rateLimiter.isLimited(
      userId,
      options.event,
      options.limit,
    );

    if (isLimited) {
      throw new RateLimitDomainException();
    }

    return true;
  }
}
