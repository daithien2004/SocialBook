// src/modules/reviews/reviews.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpStatus,
  HttpCode,
  Request,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { Public } from '@/src/common/decorators/customize';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Request() req: any, @Body() createReviewDto: CreateReviewDto) {
    const result = await this.reviewsService.create(
      createReviewDto,
      req.user.id,
    );

    return {
      message: 'Đánh giá sách thành công',
      data: result,
    };
  }

  @Public()
  @Get('book/:bookId')
  @HttpCode(HttpStatus.OK)
  async findAllByBook(@Param('bookId') bookId: string) {
    const reviews = await this.reviewsService.findAllByBook(bookId);

    return {
      message: 'Lấy danh sách đánh giá thành công',
      data: reviews,
    };
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id') id: string,
    @Body() body: UpdateReviewDto & { userId: string },
  ) {
    const { userId, ...updateData } = body;
    const updatedReview = await this.reviewsService.update(
      id,
      userId,
      updateData,
    );

    return {
      message: 'Cập nhật đánh giá thành công',
      data: updatedReview,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string, @Body('userId') userId: string) {
    await this.reviewsService.remove(id, userId);

    return {
      message: 'Xóa đánh giá thành công',
      data: null,
    };
  }
}
