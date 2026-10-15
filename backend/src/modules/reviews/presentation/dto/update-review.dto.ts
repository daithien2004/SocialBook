import { IsOptional, IsString, IsNumber, Min, Max } from 'class-validator';
import type { Actor } from '@/shared/casl/actor';
import { UpdateReviewCommand } from '../../application/commands/update-review/update-review.command';
import { UpdateReviewDto as UpdateReviewInput } from '../../application/dto/update-review.dto';

export class UpdateReviewDto {
  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  rating?: number;

  toCommand(actor: Actor, reviewId: string): UpdateReviewCommand {
    return new UpdateReviewCommand(
      actor,
      reviewId,
      new UpdateReviewInput(this.content, this.rating),
    );
  }
}
