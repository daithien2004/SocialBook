export class GetFollowStatusQuery {
    constructor(
        public readonly userId: string,
        public readonly targetId: string
    ) { }
}
