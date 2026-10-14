import { IsString, IsOptional, MaxLength } from 'class-validator';
import type { Actor } from '@/shared/casl/actor';
import { UpdateGenreCommand } from '../../application/commands/update-genre/update-genre.command';

export class UpdateGenreDto {
  @IsString()
  @IsOptional()
  @MaxLength(100, { message: 'Tên thể loại không được vượt quá 100 ký tự' })
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500, { message: 'Mô tả không được vượt quá 500 ký tự' })
  description?: string;

  toCommand(actor: Actor, id: string): UpdateGenreCommand {
    return new UpdateGenreCommand(actor, id, this.name, this.description);
  }
}
