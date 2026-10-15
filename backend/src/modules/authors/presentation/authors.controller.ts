import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  UploadedFile,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Actor } from '@/shared/casl/actor';
import { CheckPolicy } from '@/shared/casl/check-policy.decorator';
import { PoliciesGuard } from '@/shared/casl/policies.guard';
import { CurrentActor } from '@/shared/platform/decorators/current-actor.decorator';
import {
  UseImageUpload,
  Public,
} from '@/shared/platform/decorators/custom.decorator';
import {
  ApiPaginatedResponse,
  ApiProblemResponses,
} from '@/shared/platform/decorators/api-response.decorators';
import {
  paginate,
  type PageResult,
  type PaginatedResult,
} from '@/shared/domain/pagination.types';
import { GetAuthorQuery } from '../application/queries/get-author/get-author.query';
import { ListAuthorsQuery } from '../application/queries/list-authors/list-authors.query';
import type { AuthorReadModel } from '../application/read-models/author.read-model';
import { AuthorIdRequestDto } from './dto/author-id.request.dto';
import { AuthorResponseDto } from './dto/author.response.dto';
import { CreateAuthorDto } from './dto/create-author.dto';
import { FilterAuthorDto } from './dto/filter-author.dto';
import { UpdateAuthorDto } from './dto/update-author.dto';

@ApiTags('Authors')
@ApiProblemResponses([500])
@UseGuards(PoliciesGuard)
@Controller('authors')
export class AuthorsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @CheckPolicy('create', 'Author')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create an author' })
  @ApiProblemResponses([400, 409, 413])
  @ApiCreatedResponse({ type: AuthorResponseDto })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['name'],
      properties: {
        name: { type: 'string', maxLength: 100 },
        bio: { type: 'string', maxLength: 500 },
        photoUrl: {
          oneOf: [{ type: 'string' }, { type: 'string', format: 'binary' }],
        },
      },
    },
  })
  @ApiProblemResponses([401, 403])
  @UseImageUpload('photoUrl')
  async create(
    @CurrentActor() actor: Actor,
    @Body() request: CreateAuthorDto,
    @UploadedFile() photo?: Express.Multer.File,
  ): Promise<AuthorResponseDto> {
    const id = await this.commandBus.execute<string>(
      request.toCommand(actor, photo),
    );
    const result = await this.queryBus.execute<AuthorReadModel>(
      new GetAuthorQuery(actor, id),
    );
    return AuthorResponseDto.fromReadModel(result);
  }

  @Get('admin')
  @CheckPolicy('read', 'AuthorAdministration')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List authors for administration' })
  @ApiProblemResponses([400, 401, 403])
  @ApiPaginatedResponse(AuthorResponseDto, 'offset')
  async findAll(
    @CurrentActor() actor: Actor,
    @Query() request: FilterAuthorDto,
  ): Promise<PaginatedResult<AuthorResponseDto>> {
    const page = await this.queryBus.execute<PageResult<AuthorReadModel>>(
      request.toQuery(actor),
    );
    return paginate(page.items, page.total, request, (authors) =>
      AuthorResponseDto.fromArray(authors),
    );
  }

  @Get(':id')
  @Public()
  @CheckPolicy('read', 'Author')
  @ApiOperation({ summary: 'Get an author' })
  @ApiProblemResponses([400, 404])
  @ApiOkResponse({ type: AuthorResponseDto })
  async findOne(
    @CurrentActor() actor: Actor,
    @Param() request: AuthorIdRequestDto,
  ): Promise<AuthorResponseDto> {
    const result = await this.queryBus.execute<AuthorReadModel>(
      request.toQuery(actor),
    );
    return AuthorResponseDto.fromReadModel(result);
  }

  @Put(':id')
  @CheckPolicy('update', 'Author')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an author' })
  @ApiProblemResponses([400, 404, 409, 413])
  @ApiOkResponse({ type: AuthorResponseDto })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', maxLength: 100 },
        bio: { type: 'string', maxLength: 500 },
        photoUrl: {
          oneOf: [{ type: 'string' }, { type: 'string', format: 'binary' }],
        },
      },
    },
  })
  @ApiProblemResponses([401, 403])
  @UseImageUpload('photoUrl')
  async update(
    @CurrentActor() actor: Actor,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() request: UpdateAuthorDto,
    @UploadedFile() photo?: Express.Multer.File,
  ): Promise<AuthorResponseDto> {
    await this.commandBus.execute(request.toCommand(actor, id, photo));
    const result = await this.queryBus.execute<AuthorReadModel>(
      new GetAuthorQuery(actor, id),
    );
    return AuthorResponseDto.fromReadModel(result);
  }

  @Delete(':id')
  @CheckPolicy('delete', 'Author')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an author' })
  @ApiProblemResponses([400, 401, 403, 404])
  @ApiNoContentResponse()
  async remove(
    @CurrentActor() actor: Actor,
    @Param() request: AuthorIdRequestDto,
  ): Promise<void> {
    await this.commandBus.execute(request.toDeleteCommand(actor));
  }

  @Get()
  @Public()
  @CheckPolicy('read', 'Author')
  @ApiOperation({ summary: 'List authors for selection' })
  @ApiProblemResponses([400])
  @ApiPaginatedResponse(AuthorResponseDto, 'offset')
  async getForSelect(
    @CurrentActor() actor: Actor,
  ): Promise<PaginatedResult<AuthorResponseDto>> {
    const pagination = { actualPage: 1, actualLimit: 100 };
    const page = await this.queryBus.execute<PageResult<AuthorReadModel>>(
      new ListAuthorsQuery(actor, {}, { offset: 0, limit: 100 }),
    );
    return paginate(page.items, page.total, pagination, (authors) =>
      AuthorResponseDto.fromArray(authors),
    );
  }
}
