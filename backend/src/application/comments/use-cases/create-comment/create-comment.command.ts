export class CreateCommentCommand {
  constructor(
    public readonly userId: string,
    public readonly targetType:
      | 'book'
      | 'chapter'
      | 'post'
      | 'author'
      | 'paragraph',
    public readonly targetId: string,
    public readonly content: string,
    public readonly parentId?: string | null,
  ) {}
}
