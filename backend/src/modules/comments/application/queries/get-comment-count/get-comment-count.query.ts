import { GetCommentCountResult } from './get-comment-count.result';
import { Query } from '@nestjs/cqrs';
import type { Actor } from '@/shared/casl/actor';
export class GetCommentCountQuery extends Query<GetCommentCountResult> {
  constructor(
    public readonly actor: Actor,
    public readonly targetId: string,
    public readonly targetType:
      'book' | 'chapter' | 'post' | 'author' | 'paragraph',
    public readonly parentId?: string | null,
  ) {
    super();
  }
}
