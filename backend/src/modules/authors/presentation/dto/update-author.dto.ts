import { IsOptional, IsString, MaxLength } from 'class-validator';
import type { Actor } from '@/shared/casl/actor';
import type { MediaUploadFile } from '@/modules/media/domain/public-api';
import { UpdateAuthorCommand } from '../../application/commands/update-author/update-author.command';

export class UpdateAuthorDto {
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Tên tác giả không được vượt quá 100 ký tự' })
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Tiểu sử không được vượt quá 500 ký tự' })
  bio?: string;

  @IsOptional()
  @IsString()
  photoUrl?: string;

  toCommand(
    actor: Actor,
    id: string,
    photo?: MediaUploadFile,
  ): UpdateAuthorCommand {
    return new UpdateAuthorCommand(
      actor,
      id,
      this.name,
      this.bio,
      this.photoUrl,
      photo,
    );
  }
}
