import { PaginationQueryDto } from '@/shared/platform/dto/pagination-query.dto';
import { IsUUID, IsNotEmpty, IsString } from 'class-validator';
import type { Actor } from '@/shared/casl/actor';
import { GetPostsByUserQuery } from '@/modules/posts/application/posts/queries/get-posts-by-user/get-posts-by-user.query';

export class PaginationUserDto extends PaginationQueryDto {
  @IsNotEmpty({ message: 'userId is required' })
  @IsString()
  @IsUUID('4')
  userId!: string;

  toQuery(actor: Actor): GetPostsByUserQuery {
    return new GetPostsByUserQuery(
      actor,
      this.userId,
      this.actualLimit,
      this.cursor,
    );
  }
}
