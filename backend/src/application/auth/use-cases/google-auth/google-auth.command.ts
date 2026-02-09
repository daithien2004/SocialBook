export class GoogleAuthCommand {
    constructor(
        public readonly email: string,
        public readonly googleId: string,
        public readonly username?: string,
        public readonly image?: string,
        public readonly name?: string
    ) { }
}
