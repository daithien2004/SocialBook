import { IsString, IsNotEmpty, IsOptional, IsHexColor } from 'class-validator';
import type { Actor } from '@/shared/casl/actor';
import { CreateUserHighlightCommand } from '../../application/commands/create-user-highlight/create-user-highlight.command';

export class CreateUserHighlightDto {
  @IsString()
  @IsNotEmpty()
  bookId!: string;

  @IsString()
  @IsNotEmpty()
  chapterId!: string;

  @IsString()
  @IsNotEmpty()
  paragraphId!: string;

  @IsString()
  @IsNotEmpty()
  content!: string;

  @IsString()
  @IsOptional()
  @IsHexColor()
  color?: string;

  @IsString()
  @IsOptional()
  note?: string;

  toCommand(actor: Actor): CreateUserHighlightCommand {
    return new CreateUserHighlightCommand(
      actor,
      this.bookId,
      this.chapterId,
      this.paragraphId,
      this.content,
      this.color,
      this.note,
    );
  }
}
