import { Injectable, BadRequestException, InternalServerErrorException, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { IOtpRepository } from '@/domain/otp/repositories/otp.repository.interface';
import { Otp } from '@/domain/otp/entities/otp.entity';

@Injectable()
export class OtpRepository implements IOtpRepository {
    private readonly OTP_PREFIX = 'otp:';
    private readonly OTP_COUNT_PREFIX = 'otp_count:';
    private readonly OTP_EXPIRY = 300; // 5 minutes
    private readonly MAX_OTP_ATTEMPTS = 10;
    private readonly RATE_LIMIT_WINDOW = 3600; // 1 hour
    private readonly logger = new Logger(OtpRepository.name);

    constructor(@InjectRedis() private readonly redis: Redis) {}

    async save(otp: Otp): Promise<void> {
        const key = `${this.OTP_PREFIX}${otp.email}`;
        // We only save the code and reply on Redis TTL for expiry
        await this.redis.setex(key, this.OTP_EXPIRY, otp.code);

        // Track rate limiting
        const rateLimitKey = `${this.OTP_COUNT_PREFIX}${otp.email}`;
        const currentCount = await this.redis.incr(rateLimitKey);
        if (currentCount === 1) {
            await this.redis.expire(rateLimitKey, this.RATE_LIMIT_WINDOW);
        }
    }

    async findByEmail(email: string): Promise<Otp | null> {
        const key = `${this.OTP_PREFIX}${email}`;
        const code = await this.redis.get(key);
        if (!code) return null;

        // Redis TTL handles expiry, so if found, it's valid time-wise
        const ttl = await this.redis.ttl(key);
        const expiredAt = new Date(Date.now() + ttl * 1000);
        
        return new Otp(email, code, expiredAt);
    }

    async deleteByEmail(email: string): Promise<void> {
        const key = `${this.OTP_PREFIX}${email}`;
        await this.redis.del(key);
        // Also clear rate limit on successful verification? Logic in service was:
        // await this.redis.del(`${this.OTP_COUNT_PREFIX}${email}`);
        // Let's keep specific method or doing it here
        await this.redis.del(`${this.OTP_COUNT_PREFIX}${email}`);
    }

    async checkRateLimit(email: string): Promise<void> {
        const rateLimitKey = `${this.OTP_COUNT_PREFIX}${email}`;
        const count = await this.redis.get(rateLimitKey);

        if (count && parseInt(count) >= this.MAX_OTP_ATTEMPTS) {
            const ttl = await this.redis.ttl(rateLimitKey);
            const minutes = Math.ceil(ttl / 60);
            throw new BadRequestException(
                `Too many OTP requests. Please try again in ${minutes} minute(s).`
            );
        }
    }

    async getTtl(email: string): Promise<number> {
        const key = `${this.OTP_PREFIX}${email}`;
        return await this.redis.ttl(key);
    }
}

