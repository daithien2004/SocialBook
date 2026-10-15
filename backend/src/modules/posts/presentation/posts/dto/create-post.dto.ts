import { IsUUID, IsString } from 'class-validator';
import type { Actor } from '@/shared/casl/actor';
import { CreatePostCommand } from '@/modules/posts/application/posts/commands/create-post/create-post.command';

export class CreatePostDto {
  @IsUUID('4')
  bookId!: string;

  @IsString()
  content!: string;

  toCommand(actor: Actor, files?: Express.Multer.File[]): CreatePostCommand {
    return new CreatePostCommand(actor, this.bookId, this.content, files);
  }
}
