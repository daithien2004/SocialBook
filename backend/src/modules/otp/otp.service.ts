import { BadRequestException, Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import Redis from 'ioredis';
import { InjectRedis } from '@nestjs-modules/ioredis';

@Injectable()
export class OtpService {
  private readonly OTP_PREFIX = 'otp:';
  private readonly OTP_COUNT_PREFIX = 'otp_count:';
  private readonly OTP_EXPIRY = 300; // 5 phút
  private readonly MAX_OTP_ATTEMPTS = 5; // Tối đa 5 lần trong 1 giờ
  private readonly RATE_LIMIT_WINDOW = 3600; // 1 giờ

  constructor(
    @InjectRedis() private readonly redis: Redis,
    private readonly mailerService: MailerService,
  ) { }

  async generateOTP(email: string): Promise<string> {
    const key = `${this.OTP_PREFIX}${email}`;
    const rateLimitKey = `${this.OTP_COUNT_PREFIX}${email}`;

    // Kiểm tra rate limiting
    await this.checkRateLimit(email);

    // Tạo OTP 6 chữ số
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Lưu OTP vào Redis
    await this.redis.setex(key, this.OTP_EXPIRY, otp);

    // Tăng counter cho rate limiting
    const currentCount = await this.redis.incr(rateLimitKey);

    // Set expire cho counter nếu là lần đầu
    if (currentCount === 1) {
      await this.redis.expire(rateLimitKey, this.RATE_LIMIT_WINDOW);
    }

    // Gửi email
    await this.mailerService.sendMail({
      to: email,
      subject: 'Your OTP Code',
      context: {
        otp,
        expiryMinutes: Math.floor(this.OTP_EXPIRY / 60),
      },
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Your OTP Code</h2>
          <p>Your verification code is:</p>
          <h1 style="color: #4CAF50; letter-spacing: 5px;">${otp}</h1>
          <p>This code will expire in ${Math.floor(this.OTP_EXPIRY / 60)} minutes.</p>
          <p>If you didn't request this code, please ignore this email.</p>
        </div>
      `,
    });

    return otp;
  }

  async verifyOTP(email: string, inputOtp: string): Promise<boolean> {
    const key = `${this.OTP_PREFIX}${email}`;
    const storedOtp = await this.redis.get(key);

    if (!storedOtp) {
      throw new BadRequestException('OTP not found or expired');
    }

    if (storedOtp !== inputOtp) {
      throw new BadRequestException('Invalid OTP');
    }

    // Xóa OTP sau khi verify thành công
    await this.redis.del(key);

    // Reset rate limit counter khi verify thành công
    await this.redis.del(`${this.OTP_COUNT_PREFIX}${email}`);

    return true;
  }

  async getOtpTTL(email: string): Promise<number> {
    const key = `${this.OTP_PREFIX}${email}`;
    return await this.redis.ttl(key); // Trả về số giây còn lại, -2 nếu không tồn tại
  }

  private async checkRateLimit(email: string): Promise<void> {
    const rateLimitKey = `${this.OTP_COUNT_PREFIX}${email}`;
    const count = await this.redis.get(rateLimitKey);

    if (count && parseInt(count) >= this.MAX_OTP_ATTEMPTS) {
      const ttl = await this.redis.ttl(rateLimitKey);
      const minutes = Math.ceil(ttl / 60);
      throw new BadRequestException(
        `Too many OTP requests. Please try again in ${minutes} minute(s).`,
      );
    }
  }
}
