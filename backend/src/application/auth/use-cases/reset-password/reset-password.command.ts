export class ResetPasswordCommand {
    constructor(
        public readonly email: string,
        public readonly otp: string,
        public readonly newPassword: string
    ) { }
}
