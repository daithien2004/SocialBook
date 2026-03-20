export interface OtpProps {
    email: string;
    code: string;
    expiredAt: Date;
    isUsed?: boolean;
}

export class Otp {
    private _props: OtpProps;

    constructor(props: OtpProps) {
        this._props = {
            ...props,
            isUsed: props.isUsed || false
        };
    }

    get email(): string { return this._props.email; }
    get code(): string { return this._props.code; }
    get expiredAt(): Date { return this._props.expiredAt; }
    get isUsed(): boolean { return this._props.isUsed as boolean; }

    public isValid(): boolean {
        return !this._props.isUsed && this._props.expiredAt > new Date();
    }

    public markAsUsed(): Otp {
        return new Otp({
            email: this._props.email,
            code: this._props.code,
            expiredAt: this._props.expiredAt,
            isUsed: true
        });
    }
}
