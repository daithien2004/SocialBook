import { IsString, MaxLength, MinLength } from 'class-validator';
import type { Actor } from '@/shared/casl/actor';
import { GenerateTextCommand } from '@/modules/ai/application/commands/generate-text/generate-text.command';

export class GenerateTextRequestDto {
  @IsString()
  @MinLength(1)
  @MaxLength(10000)
  prompt!: string;

  toCommand(actor: Actor): GenerateTextCommand {
    return new GenerateTextCommand(this.prompt, actor);
  }
}
