import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { Public } from '@/common/decorators/customize';
import { Roles } from '@/common/decorators/roles.decorator';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';

import { ChapterResponseDto } from '@/presentation/chapters/dto/chapter.response.dto';
import { CreateChapterDto } from '@/presentation/chapters/dto/create-chapter.dto';
import { FilterChapterDto } from '@/presentation/chapters/dto/filter-chapter.dto';
import { UpdateChapterDto } from '@/presentation/chapters/dto/update-chapter.dto';
import { PaginationQueryDto } from '@/common/dto/pagination-query.dto';

import { CreateChapterUseCase } from '@/application/chapters/use-cases/create-chapter/create-chapter.use-case';
import { DeleteChapterUseCase } from '@/application/chapters/use-cases/delete-chapter/delete-chapter.use-case';
import { GetChaptersUseCase } from '@/application/chapters/use-cases/get-chapters/get-chapters.use-case';
import { UpdateChapterUseCase } from '@/application/chapters/use-cases/update-chapter/update-chapter.use-case';

import { CreateChapterCommand } from '@/application/chapters/use-cases/create-chapter/create-chapter.command';
import { DeleteChapterCommand } from '@/application/chapters/use-cases/delete-chapter/delete-chapter.command';
import { GetChapterBySlugQuery } from '@/application/chapters/use-cases/get-chapter-by-slug/get-chapter-by-slug.query';
import { GetChapterBySlugUseCase } from '@/application/chapters/use-cases/get-chapter-by-slug/get-chapter-by-slug.use-case';
import { GetChaptersQuery } from '@/application/chapters/use-cases/get-chapters/get-chapters.query';
import { UpdateChapterCommand } from '@/application/chapters/use-cases/update-chapter/update-chapter.command';
import { GetChapterByIdQuery } from '@/application/chapters/use-cases/get-chapter-by-id/get-chapter-by-id.query';
import { GetChapterByIdUseCase } from '@/application/chapters/use-cases/get-chapter-by-id/get-chapter-by-id.use-case';

@ApiTags('Chapters')
@Controller('books/:bookSlug/chapters')
export class ChaptersController {
  constructor(
    private readonly createChapterUseCase: CreateChapterUseCase,
    private readonly updateChapterUseCase: UpdateChapterUseCase,
    private readonly getChaptersUseCase: GetChaptersUseCase,
    private readonly getChapterBySlugUseCase: GetChapterBySlugUseCase,
    private readonly deleteChapterUseCase: DeleteChapterUseCase,
    private readonly getChapterByIdUseCase: GetChapterByIdUseCase,
  ) { }

  @Public()
  @Get()
  async getChapters(
    @Param('bookSlug') bookSlug: string,
    @Query() filter: PaginationQueryDto,
  ) {
    const query = new GetChaptersQuery(
      filter.page,
      filter.limit,
      undefined,
      undefined,
      bookSlug,
    );

    const result = await this.getChaptersUseCase.execute(query);

    return {
      message: 'Get list chapters successfully',
      data: result,
    };
  }

  @Public()
  @Get('all')
  async getAllChapters(@Param('bookSlug') bookSlug: string) {
    const query = new GetChaptersQuery(1, 1000, undefined, undefined, bookSlug);

    const result = await this.getChaptersUseCase.execute(query);

    return {
      message: 'Get all chapters successfully',
      data: result,
    };
  }

  @Public()
  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('id/:chapterId')
  async getChapterByIdWithPrefix(@Param('chapterId') chapterId: string) {
    const query = new GetChapterByIdQuery(chapterId);
    const chapter = await this.getChapterByIdUseCase.execute(query);
    return {
      message: 'Get chapter successfully',
      data: new ChapterResponseDto(chapter),
    };
  }

  @Public()
  @Get(':chapterSlug')
  async getChapterBySlug(@Param('chapterSlug') chapterSlug: string, @Param('bookSlug') bookSlug: string) {
    const query = new GetChapterBySlugQuery(chapterSlug, bookSlug);
    const result = await this.getChapterBySlugUseCase.execute(query);
    return {
      message: 'Get chapter successfully',
      data: result,
    };
  }

  @Post()
  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async create(@Body() createChapterDto: CreateChapterDto) {
    const command = new CreateChapterCommand(
      createChapterDto.title,
      createChapterDto.bookId,
      createChapterDto.paragraphs,
      createChapterDto.slug,
      createChapterDto.orderIndex
    );

    const chapterResult = await this.createChapterUseCase.execute(command);
    return {
      message: 'Tạo chương thành công',
      data: ChapterResponseDto.fromResult(chapterResult),
    };
  }

  @Put(':chapterId')
  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
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

    const chapterResult = await this.updateChapterUseCase.execute(command);
    return {
      message: 'Cập nhật chương thành công',
      data: ChapterResponseDto.fromResult(chapterResult),
    };
  }

  @Delete(':chapterId')
  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async remove(@Param('chapterId') chapterId: string) {
    const command = new DeleteChapterCommand(chapterId);
    await this.deleteChapterUseCase.execute(command);
    return {
      message: 'Xóa chương thành công',
    };
  }

  @Get()
  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async getAllChaptersAdmin(
    @Query() filter: FilterChapterDto,
  ) {
    const query = new GetChaptersQuery(
      filter.page,
      filter.limit,
      filter.title,
      filter.bookId,
      undefined,
      filter.orderIndex,
      filter.minWordCount,
      filter.maxWordCount,
      filter.sortBy as any,
      filter.order as any
    );

    const result = await this.getChaptersUseCase.execute(query);

    if ('book' in result && 'chapters' in result) {
      return {
        message: 'Get all chapters successfully',
        data: result,
      };
    }

    const paginatedResult = result as any;
    return {
      message: 'Get all chapters successfully',
      data: ChapterResponseDto.fromArray(paginatedResult.data),
      meta: paginatedResult.meta,
    };
  }
}
