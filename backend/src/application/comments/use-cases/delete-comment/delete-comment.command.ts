export class DeleteCommentCommand {
    constructor(
        public readonly id: string,
        public readonly userId: string,
        public readonly isAdmin?: boolean
    ) {}
}
