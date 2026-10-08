import { paginated } from '@/shared/platform/dto/paginated.dto';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Public } from '@/shared/platform/decorators/custom.decorator';
import { Roles } from '@/shared/platform/decorators/roles.decorator';
import { RolesGuard } from '@/shared/platform/guards/roles.guard';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  HttpCode,
  HttpStatus,
  Ip,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  Post,
  Put,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { CurrentUser } from '@/shared/platform/decorators/current-user.decorator';
import { FileInterceptor } from '@nestjs/platform-express';

import { PaginationQueryDto } from '@/shared/platform/dto/pagination-query.dto';
import { ChapterResponseDto } from '@/modules/chapters/presentation/chapters/dto/chapter.response.dto';
import { CreateChapterDto } from '@/modules/chapters/presentation/chapters/dto/create-chapter.dto';
import { FilterChapterDto } from '@/modules/chapters/presentation/chapters/dto/filter-chapter.dto';
import { UpdateChapterDto } from '@/modules/chapters/presentation/chapters/dto/update-chapter.dto';

import { CreateChapterCommand } from '@/modules/chapters/application/chapters/commands/create-chapter/create-chapter.command';
import { DeleteChapterCommand } from '@/modules/chapters/application/chapters/commands/delete-chapter/delete-chapter.command';
import { GetChapterByIdQuery } from '@/modules/chapters/application/chapters/queries/get-chapter-by-id/get-chapter-by-id.query';
import { GetChapterBySlugQuery } from '@/modules/chapters/application/chapters/queries/get-chapter-by-slug/get-chapter-by-slug.query';
import { GetChaptersQuery } from '@/modules/chapters/application/chapters/queries/get-chapters/get-chapters.query';
import { UpdateChapterCommand } from '@/modules/chapters/application/chapters/commands/update-chapter/update-chapter.command';
import { StartChaptersImportCommand } from '@/modules/chapters/application/chapters/commands/start-chapters-import/start-chapters-import.command';
import { GetChaptersImportStatusQuery } from '@/modules/chapters/application/chapters/queries/get-chapters-import-status/get-chapters-import-status.query';
import { StartChaptersImportDto } from './dto/start-chapters-import.dto';

import { GetChapterKnowledgeQuery } from '@/modules/chapters/application/chapters/queries/get-chapter-knowledge/get-chapter-knowledge.query';
import { AskChapterAICommand } from '@/modules/chapters/application/chapters/commands/ask-ai/ask-chapter-ai.command';
import { ChapterKnowledgeResponseDto } from './dto/chapter-knowledge.response.dto';
import { RecordChapterViewQuery } from '@/modules/chapters/application/chapters/queries/record-chapter-view/record-chapter-view.query';
import { AIThrottleGuard } from '@/shared/platform/guards/ai-throttle.guard';
import { ImportEpubPreviewCommand } from '@/modules/chapters/application/chapters/commands/import-epub-preview/import-epub-preview.command';
import { ApiProblemResponses } from '@/shared/platform/decorators/api-response.decorators';
import { ApiNoContentResponse, ApiOkResponse } from '@nestjs/swagger';

@ApiProblemResponses()
@Controller('books/:bookSlug/chapters')
export class ChaptersController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get(':chapterId/knowledge')
  async getKnowledge(
    @Param('chapterId') chapterId: string,
    @Query('force') force?: string,
  ) {
    const query = new GetChapterKnowledgeQuery(chapterId, force === 'true');
    const result = await this.queryBus.execute(query);
    return ChapterKnowledgeResponseDto.fromEntity(result);
  }

  @UseGuards(AIThrottleGuard)
  @Post(':chapterId/ask-ai')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    schema: {
      type: 'object',
      required: ['answer', 'createdAt'],
      properties: {
        answer: { type: 'string' },
        createdAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  async askAI(
    @Param('bookSlug') bookSlug: string,
    @Param('chapterId') chapterId: string,
    @Body('question') question: string,
    @CurrentUser('id') userId: string,
  ) {
    const result = await this.commandBus.execute(
      new AskChapterAICommand(chapterId, bookSlug, userId, question),
    );

    return result;
  }

  @Post('import/preview')
  @Roles('admin')
  @UseGuards(RolesGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 20 * 1024 * 1024 },
    }),
  )
  @HttpCode(HttpStatus.OK)
  async importPreview(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 20 * 1024 * 1024 }),
          new FileTypeValidator({
            fileType:
              /^(application\/epub\+zip|application\/zip|application\/x-zip-compressed)$/,
          }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    const result = await this.commandBus.execute(
      new ImportEpubPreviewCommand(file.buffer, file.originalname),
    );
    return result;
  }

  @Post('import/start')
  @Roles('admin')
  @UseGuards(RolesGuard)
  async startImport(@Body() dto: StartChaptersImportDto) {
    const command = new StartChaptersImportCommand(dto.bookId, dto.chapters);
    const result = await this.commandBus.execute(command);
    return result;
  }

  @Get('import/status/:jobId')
  @Roles('admin')
  @UseGuards(RolesGuard)
  async getImportStatus(@Param('jobId') jobId: string) {
    const query = new GetChaptersImportStatusQuery(jobId);
    const result = await this.queryBus.execute(query);
    return result;
  }

  @Public()
  @Get()
  async getChapters(
    @Param('bookSlug') bookSlug: string,
    @Query() filter: PaginationQueryDto,
  ) {
    const query = new GetChaptersQuery(
      filter.actualPage,
      filter.actualLimit,
      undefined,
      undefined,
      bookSlug,
    );

    const result = await this.queryBus.execute(query);

    return result;
  }

  @Public()
  @Get('all')
  async getAllChapters(@Param('bookSlug') bookSlug: string) {
    const query = new GetChaptersQuery(1, 1000, undefined, undefined, bookSlug);

    const result = await this.queryBus.execute(query);

    return result;
  }

  @Roles('admin')
  @UseGuards(RolesGuard)
  @Get('admin/list')
  async getAllChaptersAdmin(@Query() filter: FilterChapterDto) {
    const query = new GetChaptersQuery(
      filter.actualPage,
      filter.actualLimit,
      filter.title,
      filter.bookId,
      undefined,
      filter.orderIndex,
      filter.sortBy as
        | 'createdAt'
        | 'updatedAt'
        | 'title'
        | 'orderIndex'
        | 'viewsCount'
        | undefined,
      filter.order,
    );

    const result = await this.queryBus.execute(query);

    if ('book' in result && 'chapters' in result) {
      return result;
    }

    const paginatedResult = result;
    return paginated(
      ChapterResponseDto.fromArray(paginatedResult.data),
      paginatedResult.meta,
    );
  }

  @Get('id/:chapterId')
  @Roles('admin')
  @UseGuards(RolesGuard)
  async getChapterByIdWithPrefix(@Param('chapterId') chapterId: string) {
    const query = new GetChapterByIdQuery(chapterId);
    const chapter = await this.queryBus.execute(query);
    return new ChapterResponseDto(chapter);
  }

  @Public()
  @Get(':chapterSlug')
  async getChapterBySlug(
    @Param('chapterSlug') chapterSlug: string,
    @Param('bookSlug') bookSlug: string,
  ) {
    const query = new GetChapterBySlugQuery(chapterSlug, bookSlug);
    const result = await this.queryBus.execute(query);
    return result;
  }

  @Public()
  @Post(':chapterSlug/view')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  async recordChapterView(
    @Param('chapterSlug') chapterSlug: string,
    @Param('bookSlug') bookSlug: string,
    @CurrentUser('id') userId?: string,
    @Ip() clientIp?: string,
  ) {
    const query = new RecordChapterViewQuery(
      bookSlug,
      chapterSlug,
      userId,
      clientIp,
    );
    await this.queryBus.execute(query);
    return undefined;
  }

  @Post()
  @Roles('admin')
  @UseGuards(RolesGuard)
  async create(@Body() createChapterDto: CreateChapterDto) {
    const command = new CreateChapterCommand(
      createChapterDto.title,
      createChapterDto.bookId,
      createChapterDto.paragraphs,
      createChapterDto.slug,
      createChapterDto.orderIndex,
    );

    const chapterResult = await this.commandBus.execute(command);
    return ChapterResponseDto.fromResult(chapterResult);
  }

  @Put(':chapterId')
  @Roles('admin')
  @UseGuards(RolesGuard)
  async update(
    @Param('chapterId') chapterId: string,
    @Body() updateChapterDto: UpdateChapterDto,
  ) {
    const command = new UpdateChapterCommand(
      chapterId,
      updateChapterDto.title,
      updateChapterDto.bookId,
      updateChapterDto.paragraphs,
      updateChapterDto.slug,
      updateChapterDto.orderIndex,
    );

    const chapterResult = await this.commandBus.execute(command);
    return ChapterResponseDto.fromResult(chapterResult);
  }

  @HttpCode(204)
  @Delete(':chapterId')
  @Roles('admin')
  @UseGuards(RolesGuard)
  async remove(@Param('chapterId') chapterId: string) {
    const command = new DeleteChapterCommand(chapterId);
    await this.commandBus.execute(command);
    return undefined;
  }
}
