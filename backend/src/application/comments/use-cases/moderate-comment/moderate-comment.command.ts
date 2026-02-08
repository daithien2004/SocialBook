export class ModerateCommentCommand {
    constructor(
        public readonly id: string,
        public readonly status: 'approved' | 'rejected',
        public readonly reason?: string
    ) {}
}
