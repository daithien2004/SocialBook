import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { CreateReviewDto } from '@/application/reviews/dto/create-review.dto';
import { UpdateReviewDto } from '@/application/reviews/dto/update-review.dto';
import { Public } from '@/common/decorators/customize';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CreateReviewUseCase } from '@/application/reviews/use-cases/create-review.use-case';
import { GetBookReviewsUseCase } from '@/application/reviews/use-cases/get-book-reviews.use-case';
import { UpdateReviewUseCase } from '@/application/reviews/use-cases/update-review.use-case';
import { DeleteReviewUseCase } from '@/application/reviews/use-cases/delete-review.use-case';
import { ToggleReviewLikeUseCase } from '@/application/reviews/use-cases/toggle-review-like.use-case';
import { Review } from '@/domain/reviews/entities/review.entity';
import { ReviewResponseDto } from '@/application/reviews/dto/review.response.dto';

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
  @Get('book/:bookId')
  @HttpCode(HttpStatus.OK)
  async findAllByBook(@Req() req: Request & { user?: { id: string } }, @Param('bookId') bookId: string) {
    const userId = req.user?.id;
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
  @HttpCode(HttpStatus.CREATED)
  async create(@Req() req: Request & { user: { id: string } }, @Body() dto: CreateReviewDto) {
    const review = await this.createReviewUseCase.execute(req.user.id, dto);
    return {
      message: 'Review created successfully',
      data: this.toResponse(review),
    };
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async update(
    @Req() req: Request & { user: { id: string } },
    @Param('id') id: string,
    @Body() dto: UpdateReviewDto,
  ) {
    const review = await this.updateReviewUseCase.execute(id, req.user.id, dto);
    return {
      message: 'Review updated successfully',
      data: this.toResponse(review),
    };
  }

  @Patch(':id/like')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async toggleLike(@Req() req: Request & { user: { id: string } }, @Param('id') id: string) {
    const review = await this.toggleReviewLikeUseCase.execute(id, req.user.id);
    const isLiked = review.likedBy.includes(req.user.id);
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
  @HttpCode(HttpStatus.OK)
  async remove(@Req() req: Request & { user: { id: string } }, @Param('id') id: string) {
    await this.deleteReviewUseCase.execute(id, req.user.id);
    return {
      message: 'Review deleted successfully',
    };
  }

  private toResponse(review: Review): ReviewResponseDto {
      return new ReviewResponseDto(review);
  }
}
