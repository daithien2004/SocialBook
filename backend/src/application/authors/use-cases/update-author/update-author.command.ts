export class UpdateAuthorCommand {
    constructor(
        public readonly id: string,
        public readonly name?: string,
        public readonly bio?: string,
        public readonly photoUrl?: string
    ) {}
}
