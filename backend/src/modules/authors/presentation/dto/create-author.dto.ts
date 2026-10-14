import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import type { Actor } from '@/shared/casl/actor';
import type { MediaUploadFile } from '@/modules/media/domain/public-api';
import { CreateAuthorCommand } from '../../application/commands/create-author/create-author.command';

export class CreateAuthorDto {
  @IsNotEmpty({ message: 'Tên tác giả không được để trống' })
  @IsString()
  @MaxLength(100, { message: 'Tên tác giả không được vượt quá 100 ký tự' })
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Tiểu sử không được vượt quá 500 ký tự' })
  bio?: string;

  @IsOptional()
  @IsString()
  photoUrl?: string;

  toCommand(actor: Actor, photo?: MediaUploadFile): CreateAuthorCommand {
    return new CreateAuthorCommand(
      actor,
      this.name,
      this.bio,
      this.photoUrl,
      photo,
    );
  }
}
