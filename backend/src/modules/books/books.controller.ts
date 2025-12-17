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
  Put,
  Query,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { BooksService } from './books.service';
import { SearchService } from '../search/search.service';

import { Public } from '@/src/common/decorators/customize';
import { Roles } from '@/src/common/decorators/roles.decorator';
import { JwtAuthGuard } from '@/src/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/src/common/guards/roles.guard';

import { CreateBookDto } from './dto/create-book.dto';

@Controller('books')
export class BooksController {
  constructor(
    private readonly booksService: BooksService,
    private readonly searchService: SearchService,
  ) { }

  /**
   * GET /books - Public endpoint
   * If search query is provided, uses new intelligent search
   * Otherwise, uses old findAll for browsing
   */
  @Public()
  @Get()
  @HttpCode(HttpStatus.OK)
  async getPublicBooks(
    @Query('page') page = 1,
    @Query('limit') limit = 12,
    @Query('search') search?: string,
    @Query('genres') genres?: string,
    @Query('tags') tags?: string,
    @Query('sortBy') sortBy?: string,
    @Query('order') order?: string,
  ) {
    // If search query provided, use new intelligent search
    if (search && search.trim()) {
      const result = await this.searchService.intelligentSearch({
        query: search.trim(),
        page: +page,
        limit: +limit,
        genres,
        tags,
        sortBy: sortBy || 'score',
        order: order || 'desc',
      });

      return {
        message: 'Search completed successfully',
        data: result,
      };
    }

    // No search query - use traditional browsing with findAll
    const result = await this.booksService.findAll({
      page: +page,
      limit: +limit,
      status: 'published',
      tags,
      genres,
      sortBy,
      order,
    });

    return {
      message: 'Get published books successfully',
      data: result,
    };
  }

  @Public()
  @Get('filters/all')
  @HttpCode(HttpStatus.OK)
  async getFilters() {
    const data = await this.booksService.getFilters();
    return {
      message: 'Get filters successfully',
      data,
    };
  }

  @Public()
  @Get(':slug')
  @HttpCode(HttpStatus.OK)
  async getBookBySlug(@Request() req: any, @Param('slug') slug: string) {
    const userId = req.user?.id || null;
    const data = await this.booksService.findBySlug(slug, userId);

    return {
      message: 'Get book detail successfully',
      data,
    };
  }

  @Get('admin/all')
  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  async getAllForAdmin(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('genres') genres?: string,
    @Query('author') author?: string,
  ) {
    const result = await this.booksService.findAll({
      page: +page,
      limit: +limit,
      status,
      search,
      genres,
      author,
    });

    return {
      message: 'Admin: Get all books successfully',
      ...result,
    };
  }

  @Get('id/:id')
  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  async getBookById(@Param('id') id: string) {
    const data = await this.booksService.findById(id);
    return {
      message: 'Get book by ID successfully',
      data,
    };
  }

  @Post()
  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @UseInterceptors(FileInterceptor('coverUrl'))
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createBookDto: CreateBookDto,
    @UploadedFile() coverFile?: Express.Multer.File,
  ) {
    const data = await this.booksService.create(createBookDto, coverFile);
    return {
      message: 'Create book successfully',
      data,
    };
  }

  @Put(':id')
  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @UseInterceptors(FileInterceptor('coverUrl'))
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id') id: string,
    @Body() updateBookDto: CreateBookDto,
    @UploadedFile() coverFile?: Express.Multer.File,
  ) {
    const data = await this.booksService.update(id, updateBookDto, coverFile);
    return {
      message: 'Update book successfully',
      data,
    };
  }

  @Delete(':id')
  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  async delete(@Param('id') id: string) {
    const result = await this.booksService.delete(id);
    return {
      message: result.message,
    };
  }

  @Patch(':slug/like')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async toggleLike(@Param('slug') slug: string, @Request() req: any) {
    const result = await this.booksService.toggleLike(slug, req.user.id);
    return {
      message: result.isLiked ? 'Liked book' : 'Unliked book',
      data: result,
    };
  }

  @Public()
  @Get('id/:id/stats')
  @HttpCode(HttpStatus.OK)
  async getBookStats(@Param('id') id: string) {
    const result = await this.booksService.getBookStats(id);

    return {
      message: 'Get book stats successfully',
      data: result,
    };
  }
}
