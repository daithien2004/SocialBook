// src/modules/reviews/dto/create-review.dto.ts
import {
  IsUUID,
  IsNotEmpty,
  IsNumber,
  IsString,
  Max,
  Min,
} from 'class-validator';
import type { Actor } from '@/shared/casl/actor';
import { CreateReviewCommand } from '../../application/commands/create-review/create-review.command';
import { CreateReviewDto as CreateReviewInput } from '../../application/dto/create-review.dto';

export class CreateReviewDto {
  @IsNotEmpty()
  @IsUUID('4')
  bookId!: string;

  @IsNotEmpty()
  @IsString()
  content!: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  @Max(5)
  rating!: number;

  toCommand(actor: Actor): CreateReviewCommand {
    return new CreateReviewCommand(
      actor,
      new CreateReviewInput(this.bookId, this.content, this.rating),
    );
  }
}
