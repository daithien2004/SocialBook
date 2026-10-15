import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import type { Actor } from '@/shared/casl/actor';
import { AskChapterAICommand } from '@/modules/chapters/application/chapters/commands/ask-ai/ask-chapter-ai.command';

export class AskChapterAiRequestDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  question!: string;

  toCommand(
    actor: Actor,
    chapterId: string,
    bookSlug: string,
    userId: string,
  ): AskChapterAICommand {
    return new AskChapterAICommand(
      actor,
      chapterId,
      bookSlug,
      userId,
      this.question,
    );
  }
}
