import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';

import { CreateReviewDto } from '@/modules/reviews/presentation/dto/create-review.dto';
import { UpdateReviewDto } from '@/modules/reviews/presentation/dto/update-review.dto';
import { Public } from '@/shared/platform/decorators/custom.decorator';
import { CurrentUser } from '@/shared/platform/decorators/current-user.decorator';
import { CurrentAbility } from '@/shared/platform/decorators/current-ability.decorator';
import type { AppAbility } from '@socialbook/shared';
import { Review } from '@/modules/reviews/domain/entities/review.entity';
import { ReviewResponseDto } from '@/modules/reviews/presentation/dto/review.response.dto';
import { CreateReviewCommand } from '@/modules/reviews/application/commands/create-review/create-review.command';
import { GetBookReviewsQuery } from '@/modules/reviews/application/queries/get-book-reviews/get-book-reviews.query';
import { UpdateReviewCommand } from '@/modules/reviews/application/commands/update-review/update-review.command';
import { DeleteReviewCommand } from '@/modules/reviews/application/commands/delete-review/delete-review.command';
import { ToggleReviewLikeCommand } from '@/modules/reviews/application/commands/toggle-review-like/toggle-review-like.command';

@Controller('reviews')
export class ReviewsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Public()
  @Get('book/:bookId')
  async findAllByBook(
    @CurrentUser('id') userId: string | undefined,
    @Param('bookId') bookId: string,
  ) {
    const reviews = await this.queryBus.execute(
      new GetBookReviewsQuery(bookId),
    );

    const responseDtos = reviews.map((review: Review) => {
      const responseDto = new ReviewResponseDto(review);
      return {
        ...responseDto,
        isLiked: userId ? review.likedBy.includes(userId) : false,
      };
    });

    return {
      message: 'Get reviews successfully',
      data: responseDtos,
    };
  }

  @Post()
  async create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateReviewDto,
  ) {
    const review = await this.commandBus.execute(
      new CreateReviewCommand(userId, dto),
    );
    return {
      message: 'Review created successfully',
      data: this.toResponse(review),
    };
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @CurrentAbility() ability: AppAbility,
    @Body() dto: UpdateReviewDto,
  ) {
    const review = await this.commandBus.execute(
      new UpdateReviewCommand(id, dto, ability),
    );
    return {
      message: 'Review updated successfully',
      data: this.toResponse(review),
    };
  }

  @Patch(':id/like')
  async toggleLike(@CurrentUser('id') userId: string, @Param('id') id: string) {
    const review = await this.commandBus.execute(
      new ToggleReviewLikeCommand(id, userId),
    );
    const isLiked = review.likedBy.includes(userId);
    return {
      message: 'Toggle like review successfully',
      data: {
        likesCount: review.likesCount,
        isLiked: isLiked,
      },
    };
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentAbility() ability: AppAbility) {
    await this.commandBus.execute(new DeleteReviewCommand(id, ability));
    return {
      message: 'Review deleted successfully',
    };
  }

  private toResponse(review: Review): ReviewResponseDto {
    return new ReviewResponseDto(review);
  }
}
