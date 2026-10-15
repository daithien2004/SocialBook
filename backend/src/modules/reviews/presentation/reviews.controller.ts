import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CheckPolicy } from '@/shared/casl/check-policy.decorator';
import type { Actor } from '@/shared/casl/actor';
import { PoliciesGuard } from '@/shared/casl/policies.guard';
import { CurrentActor } from '@/shared/platform/decorators/current-actor.decorator';
import { Public } from '@/shared/platform/decorators/custom.decorator';
import {
  ApiPaginatedResponse,
  ApiProblemResponses,
} from '@/shared/platform/decorators/api-response.decorators';
import {
  paginate,
  type PaginatedResult,
} from '@/shared/domain/pagination.types';
import { CreateReviewDto } from './dto/create-review.dto';
import { GetBookReviewsDto } from './dto/get-book-reviews.dto';
import type { ReviewReadModel } from '../application/read-models/review.read-model';
import { ReviewLikeResponseDto } from './dto/review-like.response.dto';
import { ReviewResponseDto } from './dto/review.response.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { ToggleReviewLikeCommand } from '../application/commands/toggle-review-like/toggle-review-like.command';
import { DeleteReviewCommand } from '../application/commands/delete-review/delete-review.command';

@ApiTags('Reviews')
@UseGuards(PoliciesGuard)
@Controller('reviews')
export class ReviewsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Public()
  @CheckPolicy('read', 'Review')
  @Get('book/:bookId')
  @ApiOperation({ summary: 'List reviews for a book' })
  @ApiProblemResponses([400])
  @ApiPaginatedResponse(ReviewResponseDto, 'offset')
  async findAllByBook(
    @CurrentActor() actor: Actor,
    @Param('bookId', new ParseUUIDPipe({ version: '4' })) bookId: string,
    @Query() pagination: GetBookReviewsDto,
  ): Promise<PaginatedResult<ReviewResponseDto>> {
    const page = await this.queryBus.execute(pagination.toQuery(actor, bookId));
    return paginate(page.items, page.total, pagination, (items) =>
      ReviewResponseDto.fromReadModels(items),
    );
  }

  @CheckPolicy('create', 'Review')
  @ApiBearerAuth()
  @Post()
  @ApiOperation({ summary: 'Create a review' })
  @ApiProblemResponses([400, 401, 403, 409])
  @ApiCreatedResponse({ type: ReviewResponseDto })
  async create(
    @CurrentActor() actor: Actor,
    @Body() dto: CreateReviewDto,
  ): Promise<ReviewResponseDto> {
    const result = await this.commandBus.execute<ReviewReadModel>(
      dto.toCommand(actor),
    );
    return ReviewResponseDto.fromReadModel(result);
  }

  @CheckPolicy('update', 'Review')
  @ApiBearerAuth()
  @Patch(':id')
  @ApiOperation({ summary: 'Update a review' })
  @ApiProblemResponses([400, 401, 403, 404])
  @ApiOkResponse({ type: ReviewResponseDto })
  async update(
    @CurrentActor() actor: Actor,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: UpdateReviewDto,
  ): Promise<ReviewResponseDto> {
    const result = await this.commandBus.execute<ReviewReadModel>(
      dto.toCommand(actor, id),
    );
    return ReviewResponseDto.fromReadModel(result);
  }

  @CheckPolicy('like', 'Review')
  @ApiBearerAuth()
  @Patch(':id/like')
  @ApiOperation({ summary: 'Toggle a review like' })
  @ApiProblemResponses([401, 403, 404])
  @ApiOkResponse({ type: ReviewLikeResponseDto })
  async toggleLike(
    @CurrentActor() actor: Actor,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<ReviewLikeResponseDto> {
    const result = await this.commandBus.execute<ReviewReadModel>(
      new ToggleReviewLikeCommand(actor, id),
    );
    return ReviewLikeResponseDto.fromResult(result);
  }

  @CheckPolicy('delete', 'Review')
  @ApiBearerAuth()
  @HttpCode(204)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a review' })
  @ApiProblemResponses([401, 403, 404])
  @ApiNoContentResponse()
  async remove(
    @CurrentActor() actor: Actor,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<void> {
    await this.commandBus.execute(new DeleteReviewCommand(actor, id));
  }
}
