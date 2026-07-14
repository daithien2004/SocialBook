export class GetCommentCountQuery {
  constructor(
    public readonly targetId: string,
    public readonly targetType:
      | 'book'
      | 'chapter'
      | 'post'
      | 'author'
      | 'paragraph',
    public readonly parentId?: string | null,
  ) {}
}
