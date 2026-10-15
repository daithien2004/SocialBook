import type { Actor } from '@/shared/casl/actor';
import { Query } from '@nestjs/cqrs';
import type { PostResult } from '@/modules/posts/application/posts/post.result';
export class GetPostQuery extends Query<PostResult> {
  constructor(
    public readonly postId: string,
    public readonly actor: Actor,
  ) {
    super();
  }
}
