import { IsString, IsIn } from 'class-validator';

const REACTION_TYPES = [
  'cry',
  'angry',
  'laugh',
  'think',
  'shock',
  'heart',
  'fire',
  'calm',
];

export class AddReactionDto {
  @IsString()
  roomId: string;

  @IsString()
  chapterSlug: string;

  @IsString()
  paragraphId: string;

  @IsString()
  @IsIn(REACTION_TYPES)
  reactionType: string;
}
