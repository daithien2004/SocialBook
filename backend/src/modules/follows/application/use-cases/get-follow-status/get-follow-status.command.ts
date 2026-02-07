export class GetFollowStatusCommand {
    constructor(
        public readonly userId: string,
        public readonly targetId: string
    ) {}
}
