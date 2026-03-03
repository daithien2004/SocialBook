export class Otp {
    constructor(
        public readonly email: string,
        public readonly code: string,
        public readonly expiredAt: Date,
        public readonly isUsed: boolean = false,
    ) {}

    public isValid(): boolean {
        return !this.isUsed && this.expiredAt > new Date();
    }

    public markAsUsed(): Otp {
        return new Otp(this.email, this.code, this.expiredAt, true);
    }
}
