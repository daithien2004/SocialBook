import { Query } from '@nestjs/cqrs';
export class GetUserHighlightsQuery extends Query<any> {
  constructor(
    public readonly userId: string,
    public readonly bookId?: string,
    public readonly chapterId?: string,
  ) { super(); }
}