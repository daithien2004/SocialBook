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
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';

import { Public } from '@/src/common/decorators/customize';
import { JwtAuthGuard } from '@/src/common/guards/jwt-auth.guard';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Public()
  @Get('book/:bookId')
  @HttpCode(HttpStatus.OK)
  async findAllByBook(@Req() req: any, @Param('bookId') bookId: string) {
    const userId = req.user?.id;
    const data = await this.reviewsService.findAllByBook(bookId, userId);
    return {
      message: 'Get reviews successfully',
      data,
    };
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async create(@Req() req: any, @Body() dto: CreateReviewDto) {
    const data = await this.reviewsService.create(req.user.id, dto);
    return {
      message: 'Review created successfully',
      data,
    };
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateReviewDto,
  ) {
    const data = await this.reviewsService.update(id, req.user.id, dto);
    return {
      message: 'Review updated successfully',
      data,
    };
  }

  @Patch(':id/like')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async toggleLike(@Req() req: any, @Param('id') id: string) {
    const data = await this.reviewsService.toggleLike(id, req.user.id);
    return {
      message: 'Toggle like review successfully',
      data,
    };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async remove(@Req() req: any, @Param('id') id: string) {
    await this.reviewsService.remove(id, req.user.id);
    return {
      message: 'Review deleted successfully',
    };
  }
}
