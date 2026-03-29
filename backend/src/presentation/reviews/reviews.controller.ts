import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CreateReviewDto } from '@/presentation/reviews/dto/create-review.dto';
import { UpdateReviewDto } from '@/presentation/reviews/dto/update-review.dto';
import { Public } from '@/common/decorators/customize';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { CreateReviewUseCase } from '@/application/reviews/use-cases/create-review.use-case';
import { GetBookReviewsUseCase } from '@/application/reviews/use-cases/get-book-reviews.use-case';
import { UpdateReviewUseCase } from '@/application/reviews/use-cases/update-review.use-case';
import { DeleteReviewUseCase } from '@/application/reviews/use-cases/delete-review.use-case';
import { ToggleReviewLikeUseCase } from '@/application/reviews/use-cases/toggle-review-like.use-case';
import { Review } from '@/domain/reviews/entities/review.entity';
import { ReviewResponseDto } from '@/presentation/reviews/dto/review.response.dto';

@Controller('reviews')
export class ReviewsController {
  constructor(
    private readonly createReviewUseCase: CreateReviewUseCase,
    private readonly getBookReviewsUseCase: GetBookReviewsUseCase,
    private readonly updateReviewUseCase: UpdateReviewUseCase,
    private readonly deleteReviewUseCase: DeleteReviewUseCase,
    private readonly toggleReviewLikeUseCase: ToggleReviewLikeUseCase,
  ) { }

  @Public()
  @UseGuards(JwtAuthGuard)
  @Get('book/:bookId')
  async findAllByBook(
    @CurrentUser('id') userId: string | undefined,
    @Param('bookId') bookId: string
  ) {
    const reviews = await this.getBookReviewsUseCase.execute(bookId);
    
    const responseDtos = reviews.map(review => {
        const responseDto = new ReviewResponseDto(review);
        return {
            ...responseDto,
            isLiked: userId ? review.likedBy.includes(userId) : false
        };
    });
    
    return {
      message: 'Get reviews successfully',
      data: responseDtos,
    };
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@CurrentUser('id') userId: string, @Body() dto: CreateReviewDto) {
    const review = await this.createReviewUseCase.execute(userId, dto);
    return {
      message: 'Review created successfully',
      data: this.toResponse(review),
    };
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateReviewDto,
  ) {
    const review = await this.updateReviewUseCase.execute(id, userId, dto);
    return {
      message: 'Review updated successfully',
      data: this.toResponse(review),
    };
  }

  @Patch(':id/like')
  @UseGuards(JwtAuthGuard)
  async toggleLike(@CurrentUser('id') userId: string, @Param('id') id: string) {
    const review = await this.toggleReviewLikeUseCase.execute(id, userId);
    const isLiked = review.likedBy.includes(userId);
    return {
      message: 'Toggle like review successfully',
      data: {
          likesCount: review.likesCount,
          isLiked: isLiked
      },
    };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(@CurrentUser('id') userId: string, @Param('id') id: string) {
    await this.deleteReviewUseCase.execute(id, userId);
    return {
      message: 'Review deleted successfully',
    };
  }

  private toResponse(review: Review): ReviewResponseDto {
      return new ReviewResponseDto(review);
  }
}
