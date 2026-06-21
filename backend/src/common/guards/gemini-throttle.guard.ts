/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ThrottlerStorage } from '@nestjs/throttler';
import { InjectThrottlerStorage } from '@nestjs/throttler/dist/throttler.decorator';

@Injectable()
export class GeminiThrottleGuard implements CanActivate {
  private readonly guestLimit = 5;
  private readonly userLimit = 30;
  private readonly ttl = 60_000;
  private readonly blockDuration = 60_000;

  constructor(
    @InjectThrottlerStorage()
    private readonly storageService: ThrottlerStorage,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const { req, res } = this.getRequestResponse(context);

    const isAuthenticated = req.user != null;
    const limit = isAuthenticated ? this.userLimit : this.guestLimit;

    let tracker: string;
    if (isAuthenticated) {
      const userId = req.user.id || req.user._id;
      tracker = `gemini-user-${userId}`;
    } else {
      tracker = `gemini-ip-${req.ip}`;
    }

    const { totalHits, timeToExpire, isBlocked } =
      await this.storageService.increment(
        tracker,
        this.ttl,
        limit,
        this.blockDuration,
        'gemini',
      );

    if (isBlocked) {
      res.header('Retry-After', Math.ceil(timeToExpire / 1000));
      const retryAfter = Math.ceil(timeToExpire / 1000);
      const message = isAuthenticated
        ? `Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau ${retryAfter} giây.`
        : `Bạn đã hết lượt chat. Đăng nhập để được tăng giới hạn (giới hạn: ${limit} yêu cầu/phút).`;
      throw new HttpException(
        {
          status: HttpStatus.TOO_MANY_REQUESTS,
          message,
          retryAfter,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    res.header('X-RateLimit-Limit', limit);
    res.header('X-RateLimit-Remaining', Math.max(0, limit - totalHits));
    res.header('X-RateLimit-Reset', Math.ceil(timeToExpire / 1000));

    return true;
  }

  private getRequestResponse(context: ExecutionContext) {
    const http = context.switchToHttp();
    return { req: http.getRequest(), res: http.getResponse() };
  }
}
