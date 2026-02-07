export class CreateUserCommand {
    constructor(
        public readonly username: string,
        public readonly email: string,
        public readonly password?: string,
        public readonly roleId?: string,
        public readonly image?: string,
        public readonly provider?: string,
        public readonly providerId?: string
    ) {}
}
