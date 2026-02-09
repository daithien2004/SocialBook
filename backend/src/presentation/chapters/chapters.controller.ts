import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';

import { Public } from '@/common/decorators/customize';
import { Roles } from '@/common/decorators/roles.decorator';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';

import { CreateChapterDto } from '@/presentation/chapters/dto/create-chapter.dto';
import { UpdateChapterDto } from '@/presentation/chapters/dto/update-chapter.dto';
import { FilterChapterDto } from '@/presentation/chapters/dto/filter-chapter.dto';
import { ChapterResponseDto } from '@/presentation/chapters/dto/chapter.response.dto';

import { CreateChapterUseCase } from '@/application/chapters/use-cases/create-chapter/create-chapter.use-case';
import { UpdateChapterUseCase } from '@/application/chapters/use-cases/update-chapter/update-chapter.use-case';
import { GetChaptersUseCase } from '@/application/chapters/use-cases/get-chapters/get-chapters.use-case';
import { GetChapterByIdUseCase } from '@/application/chapters/use-cases/get-chapter-by-id/get-chapter-by-id.use-case';
import { DeleteChapterUseCase } from '@/application/chapters/use-cases/delete-chapter/delete-chapter.use-case';

import { CreateChapterCommand } from '@/application/chapters/use-cases/create-chapter/create-chapter.command';
import { UpdateChapterCommand } from '@/application/chapters/use-cases/update-chapter/update-chapter.command';
import { GetChaptersQuery } from '@/application/chapters/use-cases/get-chapters/get-chapters.query';
import { DeleteChapterCommand } from '@/application/chapters/use-cases/delete-chapter/delete-chapter.command';
import { GetChapterByIdQuery } from '@/application/chapters/use-cases/get-chapter-by-id/get-chapter-by-id.query';

@ApiTags('Chapters')
@Controller('books/:bookSlug/chapters')
export class ChaptersController {
  constructor(
    private readonly createChapterUseCase: CreateChapterUseCase,
    private readonly updateChapterUseCase: UpdateChapterUseCase,
    private readonly getChaptersUseCase: GetChaptersUseCase,
    private readonly getChapterByIdUseCase: GetChapterByIdUseCase,
    private readonly deleteChapterUseCase: DeleteChapterUseCase,
  ) { }

  /**
   * GET /books/:bookSlug/chapters - Get chapters by book slug
   */
  @Public()
  @Get()
  @ApiOperation({ summary: 'Get chapters by book slug' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'order', required: false, type: String })
  async getChapters(
    @Param('bookSlug') bookSlug: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '200',
    @Query('sortBy') sortBy?: string,
    @Query('order') order?: string,
  ) {
    const query = new GetChaptersQuery(
      Number(page),
      Number(limit),
      undefined,
      undefined,
      bookSlug,
      undefined,
      undefined,
      undefined,
      sortBy as any,
      order as any
    );

    const result = await this.getChaptersUseCase.execute(query);

    return {
      message: 'Get list chapters successfully',
      data: result.data.map(chapter => new ChapterResponseDto(chapter)),
      meta: result.meta,
    };
  }

  /**
   * GET /books/:bookSlug/chapters/all - Get all chapters by book slug (no pagination)
   */
  @Public()
  @Get('all')
  @ApiOperation({ summary: 'Get all chapters by book slug (no pagination)' })
  async getAllChapters(@Param('bookSlug') bookSlug: string) {
    const query = new GetChaptersQuery(1, 1000, undefined, undefined, bookSlug);

    const result = await this.getChaptersUseCase.execute(query);

    return {
      message: 'Get all chapters successfully',
      data: result.data.map(chapter => new ChapterResponseDto(chapter)),
    };
  }

  /**
   * GET /books/:bookSlug/chapters/id/:chapterId - Get chapter by ID (with id/ prefix)
   */
  @Public()
  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('id/:chapterId')
  @ApiOperation({ summary: 'Get chapter by ID (with id/ prefix)' })
  @ApiParam({ name: 'chapterId', description: 'Chapter ID' })
  async getChapterByIdWithPrefix(@Param('chapterId') chapterId: string) {
    const query = new GetChapterByIdQuery(chapterId);
    const chapter = await this.getChapterByIdUseCase.execute(query);
    return {
      message: 'Get chapter successfully',
      data: new ChapterResponseDto(chapter),
    };
  }

  /**
   * GET /books/:bookSlug/chapters/:chapterId - Get chapter by ID
   */
  @Public()
  @Get(':chapterId')
  @ApiOperation({ summary: 'Get chapter by ID' })
  @ApiParam({ name: 'chapterId', description: 'Chapter ID' })
  async getChapterById(@Param('chapterId') chapterId: string) {
    const query = new GetChapterByIdQuery(chapterId);
    const chapter = await this.getChapterByIdUseCase.execute(query);
    return {
      message: 'Get chapter successfully',
      data: new ChapterResponseDto(chapter),
    };
  }

  /**
   * POST /books/:bookSlug/chapters - Create new chapter (admin only)
   */
  @Post()
  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new chapter' })
  @ApiBody({ type: CreateChapterDto })
  async create(@Body() createChapterDto: CreateChapterDto) {
    const command = new CreateChapterCommand(
      createChapterDto.title,
      createChapterDto.bookId,
      createChapterDto.paragraphs,
      createChapterDto.slug,
      createChapterDto.orderIndex
    );

    const chapter = await this.createChapterUseCase.execute(command);
    return {
      message: 'Tạo chương thành công',
      data: new ChapterResponseDto(chapter),
    };
  }

  /**
   * PUT /books/:bookSlug/chapters/:chapterId - Update chapter (admin only)
   */
  @Put(':chapterId')
  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Update chapter' })
  @ApiParam({ name: 'chapterId', description: 'Chapter ID' })
  @ApiBody({ type: UpdateChapterDto })
  async update(
    @Param('chapterId') chapterId: string,
    @Body() updateChapterDto: UpdateChapterDto
  ) {
    const command = new UpdateChapterCommand(
      chapterId,
      updateChapterDto.title,
      updateChapterDto.bookId,
      updateChapterDto.paragraphs,
      updateChapterDto.slug,
      updateChapterDto.orderIndex
    );

    const chapter = await this.updateChapterUseCase.execute(command);
    return {
      message: 'Cập nhật chương thành công',
      data: new ChapterResponseDto(chapter),
    };
  }

  /**
   * DELETE /books/:bookSlug/chapters/:chapterId - Delete chapter (admin only)
   */
  @Delete(':chapterId')
  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Delete chapter' })
  @ApiParam({ name: 'chapterId', description: 'Chapter ID' })
  async remove(@Param('chapterId') chapterId: string) {
    const command = new DeleteChapterCommand(chapterId);
    await this.deleteChapterUseCase.execute(command);
    return {
      message: 'Xóa chương thành công',
    };
  }

  /**
   * GET /chapters - Get all chapters with filtering (admin only)
   */
  @Get()
  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Get all chapters with filtering (admin)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'title', required: false, type: String })
  @ApiQuery({ name: 'bookId', required: false, type: String })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'order', required: false, type: String })
  async getAllChaptersAdmin(
    @Query() filter: FilterChapterDto,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('sortBy') sortBy?: string,
    @Query('order') order?: string,
  ) {
    const query = new GetChaptersQuery(
      Number(page),
      Number(limit),
      filter.title,
      filter.bookId,
      undefined,
      filter.orderIndex,
      filter.minWordCount,
      filter.maxWordCount,
      sortBy as any,
      order as any
    );

    const result = await this.getChaptersUseCase.execute(query);

    return {
      message: 'Get all chapters successfully',
      data: result.data.map(chapter => new ChapterResponseDto(chapter)),
      meta: result.meta,
    };
  }
}
