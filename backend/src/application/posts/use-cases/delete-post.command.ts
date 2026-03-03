export class DeletePostCommand {
    constructor(
        public readonly userId: string,
        public readonly postId: string,
        public readonly isHardDelete: boolean = false,
        public readonly isAdmin: boolean = false
    ) { }
}
