import { Otp } from '../entities/otp.entity';

export abstract class IOtpRepository {
    abstract save(otp: Otp): Promise<void>;
    abstract findByEmail(email: string): Promise<Otp | null>;
    abstract deleteByEmail(email: string): Promise<void>;
    abstract checkRateLimit(email: string): Promise<void>;
    abstract getTtl(email: string): Promise<number>;
}
