import { IsBoolean, IsOptional } from 'class-validator';
import type { Actor } from '@/shared/casl/actor';
import { GenerateChapterKnowledgeCommand } from '@/modules/chapters/application/chapters/commands/generate-chapter-knowledge/generate-chapter-knowledge.command';

export class GenerateChapterKnowledgeRequestDto {
  @IsOptional()
  @IsBoolean()
  force = false;

  toCommand(actor: Actor, chapterId: string): GenerateChapterKnowledgeCommand {
    return new GenerateChapterKnowledgeCommand(actor, chapterId, this.force);
  }
}
