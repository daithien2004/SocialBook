export class CreateFollowCommand {
    constructor(
        public readonly userId: string,
        public readonly targetId: string,
        public readonly status?: boolean
    ) {}
}
