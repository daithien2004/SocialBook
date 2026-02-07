export class DeleteFollowCommand {
    constructor(
        public readonly userId: string,
        public readonly targetId: string
    ) {}
}
