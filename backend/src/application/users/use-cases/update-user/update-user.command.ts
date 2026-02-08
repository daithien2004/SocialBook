export class UpdateUserCommand {
    constructor(
        public readonly id: string,
        public readonly username?: string,
        public readonly bio?: string,
        public readonly location?: string,
        public readonly website?: string,
        public readonly image?: string
    ) {}
}
