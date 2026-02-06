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
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { SearchService } from '../search/search.service';
import { BooksService } from './books.service';

import { Public } from '@/src/common/decorators/customize';
import { Roles } from '@/src/common/decorators/roles.decorator';
import { JwtAuthGuard } from '@/src/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/src/common/guards/roles.guard';

import { CreateBookDto } from './dto/create-book.dto';

@ApiTags('Books')
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
  @ApiOperation({ summary: 'Get public books (browse & search)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'genres', required: false, type: String })
  @ApiQuery({ name: 'tags', required: false, type: String })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'order', required: false, enum: ['asc', 'desc'] })
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
  @ApiOperation({ summary: 'Get all configured filters' })
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
  @ApiOperation({ summary: 'Get book by slug' })
  @ApiParam({ name: 'slug', type: 'string' })
  @HttpCode(HttpStatus.OK)
  async getBookBySlug(@Request() req: Request & { user?: { id: string } }, @Param('slug') slug: string) {
    const userId = req.user?.id || undefined;
    const data = await this.booksService.findBySlug(slug, userId);

    return {
      message: 'Get book detail successfully',
      data,
    };
  }

  @Get('admin/all')
  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all books (Admin)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'genres', required: false })
  @ApiQuery({ name: 'author', required: false })
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
      books: result.data,
      pagination: result.meta,
    };
  }

  @Get('id/:id')
  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get book by ID (Admin)' })
  @ApiParam({ name: 'id', type: 'string' })
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
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('coverUrl'))
  @ApiOperation({ summary: 'Create a new book (Admin)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        authorId: { type: 'string' },
        description: { type: 'string' },
        publishedYear: { type: 'string' },
        genres: { type: 'array', items: { type: 'string' } },
        tags: { type: 'array', items: { type: 'string' } },
        status: { type: 'string', enum: ['draft', 'published', 'completed'] },
        coverUrl: { type: 'string', format: 'binary' },
      },
      required: ['title', 'authorId'],
    },
  })
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
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('coverUrl'))
  @ApiOperation({ summary: 'Update a book (Admin)' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        authorId: { type: 'string' },
        description: { type: 'string' },
        publishedYear: { type: 'string' },
        genres: { type: 'array', items: { type: 'string' } },
        tags: { type: 'array', items: { type: 'string' } },
        status: { type: 'string', enum: ['draft', 'published', 'completed'] },
        coverUrl: { type: 'string', format: 'binary' },
      },
    },
  })
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
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a book (Admin)' })
  @ApiParam({ name: 'id', type: 'string' })
  @HttpCode(HttpStatus.OK)
  async delete(@Param('id') id: string) {
    const result = await this.booksService.delete(id);
    return {
      message: result.message,
    };
  }

  @Patch(':slug/like')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle like book' })
  @ApiParam({ name: 'slug', type: 'string' })
  @HttpCode(HttpStatus.OK)
  async toggleLike(@Param('slug') slug: string, @Request() req: Request & { user: { id: string } }) {
    const result = await this.booksService.toggleLike(slug, req.user.id);
    return {
      message: result.isLiked ? 'Liked book' : 'Unliked book',
      data: result,
    };
  }

  @Public()
  @Get('id/:id/stats')
  @ApiOperation({ summary: 'Get book statistics' })
  @ApiParam({ name: 'id', type: 'string' })
  @HttpCode(HttpStatus.OK)
  async getBookStats(@Param('id') id: string) {
    const result = await this.booksService.getBookStats(id);

    return {
      message: 'Get book stats successfully',
      data: result,
    };
  }
}
