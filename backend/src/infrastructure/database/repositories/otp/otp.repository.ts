import { Injectable, BadRequestException, Logger, Inject } from '@nestjs/common';
import { IOtpRepository } from '@/domain/otp/repositories/otp.repository.interface';
import { Otp } from '@/domain/otp/entities/otp.entity';
import type { ICacheService } from '@/domain/shared/cache/cache.service.interface';
import { CACHE_SERVICE } from '@/domain/shared/cache/cache.service.interface';

@Injectable()
export class OtpRepository implements IOtpRepository {
  private readonly OTP_PREFIX = 'otp:';
  private readonly OTP_COUNT_PREFIX = 'otp_count:';
  private readonly OTP_EXPIRY = 300; // 5 minutes in seconds
  private readonly MAX_OTP_ATTEMPTS = 10;
  private readonly RATE_LIMIT_WINDOW = 3600; // 1 hour in seconds
  private readonly logger = new Logger(OtpRepository.name);

  constructor(@Inject(CACHE_SERVICE) private readonly cacheService: ICacheService) {}

  async save(otp: Otp): Promise<void> {
    // Store OTP code with TTL
    const otpKey = `${this.OTP_PREFIX}${otp.email}`;
    await this.cacheService.set(otpKey, otp.code, this.OTP_EXPIRY);

    // Track rate limiting — increment count, set TTL only on first request
    const rateLimitKey = `${this.OTP_COUNT_PREFIX}${otp.email}`;
    const existing = await this.cacheService.get<number>(rateLimitKey);
    const newCount = (existing ?? 0) + 1;
    const ttl = existing !== null ? undefined : this.RATE_LIMIT_WINDOW;
    await this.cacheService.set(rateLimitKey, newCount, ttl);

    this.logger.log(`[OTP] Saved OTP for ${otp.email}, attempt #${newCount}`);
  }

  async findByEmail(email: string): Promise<Otp | null> {
    const otpKey = `${this.OTP_PREFIX}${email}`;
    const code = await this.cacheService.get<string>(otpKey);
    if (!code) return null;

    // TTL is managed by Redis — use a fixed expiry approximation
    const expiredAt = new Date(Date.now() + this.OTP_EXPIRY * 1000);
    return new Otp({ email, code, expiredAt });
  }

  async deleteByEmail(email: string): Promise<void> {
    await this.cacheService.del(`${this.OTP_PREFIX}${email}`);
    await this.cacheService.del(`${this.OTP_COUNT_PREFIX}${email}`);
  }

  async checkRateLimit(email: string): Promise<void> {
    const rateLimitKey = `${this.OTP_COUNT_PREFIX}${email}`;
    const count = await this.cacheService.get<number>(rateLimitKey);

    if (count !== null && count >= this.MAX_OTP_ATTEMPTS) {
      this.logger.warn(`[OTP] Rate limit exceeded for ${email}`);
      throw new BadRequestException(`Too many OTP requests. Please try again later.`);
    }
  }

  async getTtl(_email: string): Promise<number> {
    return this.OTP_EXPIRY;
  }
}
