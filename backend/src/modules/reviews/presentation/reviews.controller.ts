import { ApiTags } from '@nestjs/swagger';
import { buildPaginationMeta } from '@/shared/domain/pagination.types';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  HttpCode,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  ParseUUIDPipe,
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
import {
  ApiPaginatedResponse,
  ApiProblemResponses,
} from '@/shared/platform/decorators/api-response.decorators';
import {
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger';

@ApiProblemResponses()
@ApiTags('Reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @ApiOperation({ summary: 'Find All By Book' })
  @Public()
  @Get('book/:bookId')
  @ApiPaginatedResponse(ReviewResponseDto, 'offset')
  async findAllByBook(
    @CurrentUser('id') userId: string | undefined,
    @Param('bookId', new ParseUUIDPipe({ version: '4' })) bookId: string,
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
      data: responseDtos,
      meta: buildPaginationMeta(
        1,
        Math.max(responseDtos.length, 1),
        responseDtos.length,
      ),
    };
  }

  @ApiOperation({ summary: 'Create' })
  @Post()
  @ApiCreatedResponse({ type: ReviewResponseDto })
  async create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateReviewDto,
  ) {
    const review = await this.commandBus.execute(
      new CreateReviewCommand(userId, dto),
    );
    return this.toResponse(review);
  }

  @ApiOperation({ summary: 'Update' })
  @Patch(':id')
  @ApiOkResponse({ type: ReviewResponseDto })
  async update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentAbility() ability: AppAbility,
    @Body() dto: UpdateReviewDto,
  ) {
    const review = await this.commandBus.execute(
      new UpdateReviewCommand(id, dto, ability),
    );
    return this.toResponse(review);
  }

  @ApiOperation({ summary: 'Toggle like' })
  @Patch(':id/like')
  @ApiOkResponse({
    schema: {
      type: 'object',
      required: ['likesCount', 'isLiked'],
      properties: {
        likesCount: { type: 'integer' },
        isLiked: { type: 'boolean' },
      },
    },
  })
  async toggleLike(
    @CurrentUser('id') userId: string,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    const review = await this.commandBus.execute(
      new ToggleReviewLikeCommand(id, userId),
    );
    const isLiked = review.likedBy.includes(userId);
    return {
      likesCount: review.likesCount,
      isLiked: isLiked,
    };
  }

  @ApiOperation({ summary: 'Delete' })
  @HttpCode(204)
  @Delete(':id')
  @ApiNoContentResponse()
  async remove(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentAbility() ability: AppAbility,
  ) {
    await this.commandBus.execute(new DeleteReviewCommand(id, ability));
    return undefined;
  }

  private toResponse(review: Review): ReviewResponseDto {
    return new ReviewResponseDto(review);
  }
}
