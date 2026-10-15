import { IsArray, IsOptional, IsString, IsUUID } from 'class-validator';
import type { Actor } from '@/shared/casl/actor';
import { UpdatePostCommand } from '@/modules/posts/application/posts/commands/update-post/update-post.command';

export class UpdatePostDto {
  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsUUID('4')
  bookId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  imageUrls?: string[];

  toCommand(
    actor: Actor,
    postId: string,
    files?: Express.Multer.File[],
  ): UpdatePostCommand {
    return new UpdatePostCommand(
      actor,
      postId,
      this.content,
      this.bookId,
      this.imageUrls,
      files,
    );
  }
}
