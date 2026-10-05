import { Post } from '@/domain/posts/entities/post.entity';
import { Query } from '@nestjs/cqrs';
export class GetPostQuery extends Query<Post> {
  constructor(
    public readonly postId: string,
    public readonly viewerUserId?: string,
  ) {
    super();}
}
