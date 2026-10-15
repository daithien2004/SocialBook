import { IsString, IsOptional, IsHexColor } from 'class-validator';
import type { Actor } from '@/shared/casl/actor';
import { UpdateUserHighlightCommand } from '../../application/commands/update-user-highlight/update-user-highlight.command';

export class UpdateUserHighlightDto {
  @IsString()
  @IsOptional()
  @IsHexColor()
  color?: string;

  @IsString()
  @IsOptional()
  note?: string;

  toCommand(actor: Actor, highlightId: string): UpdateUserHighlightCommand {
    return new UpdateUserHighlightCommand(
      highlightId,
      actor,
      this.color,
      this.note,
    );
  }
}
