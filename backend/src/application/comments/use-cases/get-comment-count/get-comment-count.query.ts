export class GetCommentCountQuery {
    constructor(
        public readonly targetId: string,
        public readonly targetType: 'book' | 'chapter' | 'post' | 'author',
        public readonly parentId?: string | null,
    ) { }
}
