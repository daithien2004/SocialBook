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
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import type { Actor } from '@/shared/casl/actor';
import { CheckPolicy } from '@/shared/casl/check-policy.decorator';
import { PoliciesGuard } from '@/shared/casl/policies.guard';
import { CurrentActor } from '@/shared/platform/decorators/current-actor.decorator';
import { Public } from '@/shared/platform/decorators/custom.decorator';
import {
  ApiPaginatedResponse,
  ApiProblemResponses,
} from '@/shared/platform/decorators/api-response.decorators';
import {
  paginate,
  type PaginatedResult,
} from '@/shared/domain/pagination.types';
import type { GenreReadModel } from '../application/read-models/genre.read-model';
import { CreateGenreDto } from './dto/create-genre.dto';
import { FilterGenreDto } from './dto/filter-genre.dto';
import { GenreIdRequestDto } from './dto/genre-id.request.dto';
import { GenreResponseDto } from './dto/genre.response.dto';
import { UpdateGenreDto } from './dto/update-genre.dto';

@ApiTags('Genres')
@ApiProblemResponses([401, 403, 500])
@UseGuards(PoliciesGuard)
@Controller('genres')
export class GenresController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @CheckPolicy('create', 'Genre')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a genre' })
  @ApiProblemResponses([400, 409])
  @ApiCreatedResponse({ type: GenreResponseDto })
  async create(
    @CurrentActor() actor: Actor,
    @Body() request: CreateGenreDto,
  ): Promise<GenreResponseDto> {
    const result = await this.commandBus.execute<GenreReadModel>(
      request.toCommand(actor),
    );
    return GenreResponseDto.fromReadModel(result);
  }

  @Get()
  @Public()
  @CheckPolicy('read', 'Genre')
  @ApiOperation({ summary: 'List genres' })
  @ApiProblemResponses([400])
  @ApiPaginatedResponse(GenreResponseDto, 'offset')
  async findAll(
    @CurrentActor() actor: Actor,
    @Query() request: FilterGenreDto,
  ): Promise<PaginatedResult<GenreResponseDto>> {
    const page = await this.queryBus.execute<{
      items: GenreReadModel[];
      total: number;
    }>(request.toQuery(actor));
    return paginate(page.items, page.total, request, (items) =>
      GenreResponseDto.fromArray(items),
    );
  }

  @Get('admin')
  @CheckPolicy('read', 'GenreAdministration')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List genres for administration' })
  @ApiProblemResponses([400])
  @ApiPaginatedResponse(GenreResponseDto, 'offset')
  async findAllAdmin(
    @CurrentActor() actor: Actor,
    @Query() request: FilterGenreDto,
  ): Promise<PaginatedResult<GenreResponseDto>> {
    const page = await this.queryBus.execute<{
      items: GenreReadModel[];
      total: number;
    }>(request.toQuery(actor));
    return paginate(page.items, page.total, request, (items) =>
      GenreResponseDto.fromArray(items),
    );
  }

  @Get(':id')
  @Public()
  @CheckPolicy('read', 'Genre')
  @ApiOperation({ summary: 'Get a genre' })
  @ApiProblemResponses([400, 404])
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiOkResponse({ type: GenreResponseDto })
  async findOne(
    @CurrentActor() actor: Actor,
    @Param() request: GenreIdRequestDto,
  ): Promise<GenreResponseDto> {
    const result = await this.queryBus.execute<GenreReadModel>(
      request.toQuery(actor),
    );
    return GenreResponseDto.fromReadModel(result);
  }

  @Patch(':id')
  @CheckPolicy('update', 'Genre')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a genre' })
  @ApiProblemResponses([400, 404, 409])
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiOkResponse({ type: GenreResponseDto })
  async update(
    @CurrentActor() actor: Actor,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() request: UpdateGenreDto,
  ): Promise<GenreResponseDto> {
    const result = await this.commandBus.execute<GenreReadModel>(
      request.toCommand(actor, id),
    );
    return GenreResponseDto.fromReadModel(result);
  }

  @Delete(':id')
  @CheckPolicy('delete', 'Genre')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a genre' })
  @ApiProblemResponses([400, 404, 409])
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiNoContentResponse()
  async remove(
    @CurrentActor() actor: Actor,
    @Param() request: GenreIdRequestDto,
  ): Promise<void> {
    await this.commandBus.execute(request.toDeleteCommand(actor));
  }
}
