import { ApiTags } from '@nestjs/swagger';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Public } from '@/shared/platform/decorators/custom.decorator';
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
  ParseUUIDPipe,
} from '@nestjs/common';
import { CurrentUser } from '@/shared/platform/decorators/current-user.decorator';
import { CurrentActor } from '@/shared/platform/decorators/current-actor.decorator';
import { IdempotencyKey } from '@/shared/platform/decorators/idempotency-key.decorator';
import type { Actor } from '@/shared/casl/actor';
import { CheckPolicy } from '@/shared/casl/check-policy.decorator';
import { PoliciesGuard } from '@/shared/casl/policies.guard';
import { FileInterceptor } from '@nestjs/platform-express';

import { ChapterResponseDto } from '@/modules/chapters/presentation/chapters/dto/chapter.response.dto';
import { ChapterDetailResponseDto } from '@/modules/chapters/presentation/chapters/dto/chapter-detail.response.dto';
import { ChapterListResponseDto } from '@/modules/chapters/presentation/chapters/dto/chapter-list.response.dto';
import {
  AskChapterAiResponseDto,
  ChaptersImportStatusResponseDto,
  ImportEpubPreviewResponseDto,
  StartChaptersImportResponseDto,
} from '@/modules/chapters/presentation/chapters/dto/chapter-operation.response.dto';
import type { ChapterListReadModel } from '@/modules/chapters/application/read-models/chapter-list.read-model';
import type { ChapterReadModel } from '@/modules/chapters/application/read-models/chapter.read-model';
import type { PaginatedResult } from '@/shared/domain/pagination.types';
import { CreateChapterDto } from '@/modules/chapters/presentation/chapters/dto/create-chapter.dto';
import { FilterChapterDto } from '@/modules/chapters/presentation/chapters/dto/filter-chapter.dto';
import { GetBookChaptersQueryDto } from '@/modules/chapters/presentation/chapters/dto/get-book-chapters.query.dto';
import { UpdateChapterDto } from '@/modules/chapters/presentation/chapters/dto/update-chapter.dto';

import { DeleteChapterCommand } from '@/modules/chapters/application/chapters/commands/delete-chapter/delete-chapter.command';
import { GetChapterByIdQuery } from '@/modules/chapters/application/chapters/queries/get-chapter-by-id/get-chapter-by-id.query';
import { GetChapterBySlugQuery } from '@/modules/chapters/application/chapters/queries/get-chapter-by-slug/get-chapter-by-slug.query';
import { GetChaptersImportStatusQuery } from '@/modules/chapters/application/chapters/queries/get-chapters-import-status/get-chapters-import-status.query';
import { StartChaptersImportDto } from './dto/start-chapters-import.dto';
import { AskChapterAiRequestDto } from './dto/ask-chapter-ai.request.dto';
import { GenerateChapterKnowledgeRequestDto } from './dto/generate-chapter-knowledge.request.dto';

import { ChapterKnowledgeResponseDto } from './dto/chapter-knowledge.response.dto';
import { RecordChapterViewCommand } from '@/modules/chapters/application/chapters/commands/record-chapter-view/record-chapter-view.command';
import { AIThrottleGuard } from '@/modules/ai/presentation/public-api';
import { ImportEpubPreviewCommand } from '@/modules/chapters/application/chapters/commands/import-epub-preview/import-epub-preview.command';
import {
  ApiPaginatedResponse,
  ApiProblemResponses,
} from '@/shared/platform/decorators/api-response.decorators';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger';

@ApiProblemResponses()
@ApiTags('Chapters')
@UseGuards(PoliciesGuard)
@Controller('books/:bookSlug/chapters')
export class ChaptersController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @ApiOperation({ summary: 'Generate chapter knowledge' })
  @ApiBearerAuth()
  @ApiOkResponse({ type: ChapterKnowledgeResponseDto })
  @CheckPolicy('read', 'Chapter')
  @Post(':chapterId/knowledge')
  @HttpCode(HttpStatus.OK)
  async generateKnowledge(
    @CurrentActor() actor: Actor,
    @Param('chapterId', new ParseUUIDPipe({ version: '4' })) chapterId: string,
    @Body() dto: GenerateChapterKnowledgeRequestDto,
  ) {
    const result = await this.commandBus.execute(
      dto.toCommand(actor, chapterId),
    );
    return ChapterKnowledgeResponseDto.fromResult(result);
  }

  @ApiOperation({ summary: 'Ask AI' })
  @ApiBearerAuth()
  @ApiOkResponse({ type: AskChapterAiResponseDto })
  @UseGuards(AIThrottleGuard)
  @CheckPolicy('read', 'Chapter')
  @Post(':chapterId/ask-ai')
  @HttpCode(HttpStatus.OK)
  async askAI(
    @CurrentActor() actor: Actor,
    @Param('bookSlug') bookSlug: string,
    @Param('chapterId', new ParseUUIDPipe({ version: '4' })) chapterId: string,
    @Body() dto: AskChapterAiRequestDto,
    @CurrentUser('id') userId: string,
  ) {
    const result = await this.commandBus.execute(
      dto.toCommand(actor, chapterId, bookSlug, userId),
    );

    return AskChapterAiResponseDto.fromResult(result);
  }

  @ApiOperation({ summary: 'Import Preview' })
  @ApiBearerAuth()
  @ApiOkResponse({ type: ImportEpubPreviewResponseDto })
  @CheckPolicy('manage', 'Chapter')
  @Post('import/preview')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 20 * 1024 * 1024 },
    }),
  )
  @HttpCode(HttpStatus.OK)
  async importPreview(
    @CurrentActor() actor: Actor,
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
      new ImportEpubPreviewCommand(actor, file.buffer, file.originalname),
    );
    return ImportEpubPreviewResponseDto.fromResult(result);
  }

  @ApiOperation({ summary: 'Start Import' })
  @ApiBearerAuth()
  @ApiCreatedResponse({ type: StartChaptersImportResponseDto })
  @CheckPolicy('manage', 'Chapter')
  @Post('import/start')
  async startImport(
    @Body() dto: StartChaptersImportDto,
    @IdempotencyKey({ required: true }) idempotencyKey: string,
    @CurrentActor() actor: Actor,
  ) {
    const result = await this.commandBus.execute(
      dto.toCommand(actor, idempotencyKey),
    );
    return StartChaptersImportResponseDto.fromResult(result);
  }

  @ApiOperation({ summary: 'Get Import Status' })
  @ApiBearerAuth()
  @ApiOkResponse({ type: ChaptersImportStatusResponseDto })
  @CheckPolicy('manage', 'Chapter')
  @Get('import/status/:jobId')
  async getImportStatus(
    @CurrentActor() actor: Actor,
    @Param('jobId') jobId: string,
  ) {
    const query = new GetChaptersImportStatusQuery(actor, jobId);
    const result = await this.queryBus.execute(query);
    return ChaptersImportStatusResponseDto.fromResult(result);
  }

  @ApiOperation({ summary: 'Get Chapters' })
  @ApiOkResponse({ type: ChapterListResponseDto })
  @CheckPolicy('read', 'Chapter')
  @Public()
  @Get()
  async getChapters(
    @CurrentActor() actor: Actor,
    @Param('bookSlug') bookSlug: string,
    @Query() filter: GetBookChaptersQueryDto,
  ) {
    const query = filter.toQuery(actor, bookSlug);
    const result = await this.queryBus.execute<ChapterListReadModel>(query);
    return ChapterListResponseDto.fromReadModel(result);
  }

  @ApiOperation({ summary: 'Get All Chapters' })
  @ApiOkResponse({ type: ChapterListResponseDto })
  @CheckPolicy('read', 'Chapter')
  @Public()
  @Get('all')
  async getAllChapters(
    @CurrentActor() actor: Actor,
    @Param('bookSlug') bookSlug: string,
    @Query() pagination: GetBookChaptersQueryDto,
  ) {
    const query = pagination.toQuery(actor, bookSlug);
    const result = await this.queryBus.execute<ChapterListReadModel>(query);
    return ChapterListResponseDto.fromReadModel(result);
  }

  @ApiOperation({ summary: 'Get All Chapters Admin' })
  @ApiPaginatedResponse(ChapterResponseDto, 'offset')
  @ApiBearerAuth()
  @CheckPolicy('manage', 'Chapter')
  @Get('admin/list')
  async getAllChaptersAdmin(
    @CurrentActor() actor: Actor,
    @Query() filter: FilterChapterDto,
  ) {
    const query = filter.toQuery(actor);
    const paginatedResult =
      await this.queryBus.execute<PaginatedResult<ChapterReadModel>>(query);
    return {
      data: ChapterResponseDto.fromArray(paginatedResult.data),
      meta: paginatedResult.meta,
    };
  }

  @ApiOperation({ summary: 'Get Chapter By Id With Prefix' })
  @ApiBearerAuth()
  @ApiOkResponse({ type: ChapterResponseDto })
  @CheckPolicy('manage', 'Chapter')
  @Get('id/:chapterId')
  async getChapterByIdWithPrefix(
    @CurrentActor() actor: Actor,
    @Param('chapterId', new ParseUUIDPipe({ version: '4' })) chapterId: string,
  ) {
    const query = new GetChapterByIdQuery(actor, chapterId);
    const chapter = await this.queryBus.execute(query);
    return new ChapterResponseDto(chapter);
  }

  @ApiOperation({ summary: 'Get Chapter By Slug' })
  @ApiOkResponse({ type: ChapterDetailResponseDto })
  @CheckPolicy('read', 'Chapter')
  @Public()
  @Get(':chapterSlug')
  async getChapterBySlug(
    @CurrentActor() actor: Actor,
    @Param('chapterSlug') chapterSlug: string,
    @Param('bookSlug') bookSlug: string,
  ) {
    const query = new GetChapterBySlugQuery(actor, chapterSlug, bookSlug);
    const result = await this.queryBus.execute(query);
    return ChapterDetailResponseDto.fromReadModel(result);
  }

  @ApiOperation({ summary: 'Record Chapter View' })
  @CheckPolicy('read', 'Chapter')
  @Public()
  @Post(':chapterSlug/view')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  async recordChapterView(
    @CurrentActor() actor: Actor,
    @Param('chapterSlug') chapterSlug: string,
    @Param('bookSlug') bookSlug: string,
    @CurrentUser('id') userId?: string,
    @Ip() clientIp?: string,
  ) {
    const command = new RecordChapterViewCommand(
      actor,
      bookSlug,
      chapterSlug,
      userId,
      clientIp,
    );
    await this.commandBus.execute(command);
    return undefined;
  }

  @ApiOperation({ summary: 'Create' })
  @ApiBearerAuth()
  @CheckPolicy('create', 'Chapter')
  @ApiProblemResponses([409, 422])
  @ApiCreatedResponse({ type: ChapterResponseDto })
  @Post()
  async create(
    @CurrentActor() actor: Actor,
    @Body() createChapterDto: CreateChapterDto,
  ) {
    const chapterResult = await this.commandBus.execute(
      createChapterDto.toCommand(actor),
    );
    return ChapterResponseDto.fromResult(chapterResult);
  }

  @ApiOperation({ summary: 'Update' })
  @ApiBearerAuth()
  @CheckPolicy('update', 'Chapter')
  @ApiOkResponse({ type: ChapterResponseDto })
  @Put(':chapterId')
  async update(
    @CurrentActor() actor: Actor,
    @Param('chapterId', new ParseUUIDPipe({ version: '4' })) chapterId: string,
    @Body() updateChapterDto: UpdateChapterDto,
  ) {
    const chapterResult = await this.commandBus.execute(
      updateChapterDto.toCommand(actor, chapterId),
    );
    return ChapterResponseDto.fromResult(chapterResult);
  }

  @ApiOperation({ summary: 'Delete' })
  @ApiBearerAuth()
  @CheckPolicy('delete', 'Chapter')
  @ApiProblemResponses([404, 409])
  @HttpCode(204)
  @Delete(':chapterId')
  async remove(
    @CurrentActor() actor: Actor,
    @Param('chapterId', new ParseUUIDPipe({ version: '4' })) chapterId: string,
  ) {
    const command = new DeleteChapterCommand(actor, chapterId);
    await this.commandBus.execute(command);
    return undefined;
  }
}
