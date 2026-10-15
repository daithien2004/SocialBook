import { ApiTags } from '@nestjs/swagger';
import { paginate } from '@/shared/domain/pagination.types';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { UpdateCollectionCommand } from '@/modules/library/application/library/commands/update-collection/update-collection.command';
import { GetCollectionByIdQuery } from '@/modules/library/application/library/queries/get-collection-by-id/get-collection-by-id.query';
import { DeleteCollectionCommand } from '@/modules/library/application/library/commands/delete-collection/delete-collection.command';
import { CreateCollectionCommand } from '@/modules/library/application/library/commands/create-collection/create-collection.command';
import { GetCollectionsQueryDto } from '@/modules/library/presentation/collections/dto/get-collections.query.dto';

import { Public } from '@/shared/platform/decorators/custom.decorator';
import { CurrentActor } from '@/shared/platform/decorators/current-actor.decorator';
import type { Actor } from '@/shared/casl/actor';
import { CheckPolicy } from '@/shared/casl/check-policy.decorator';
import { PoliciesGuard } from '@/shared/casl/policies.guard';
import {
  CreateCollectionDto,
  UpdateCollectionDto,
} from '@/modules/library/presentation/library/dto/collection.dto';
import {
  CollectionDetailResponseDto,
  CollectionResponseDto,
} from '@/modules/library/presentation/library/dto/library.response.dto';
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
  Query,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiPaginatedResponse,
  ApiProblemResponses,
} from '@/shared/platform/decorators/api-response.decorators';
import {
  ApiCreatedResponse,
  ApiExtraModels,
  ApiNoContentResponse,
  ApiOkResponse,
  getSchemaPath,
  ApiOperation,
} from '@nestjs/swagger';

@ApiProblemResponses()
@ApiTags('Library')
@Controller('collections')
@UseGuards(PoliciesGuard)
export class CollectionsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @ApiOperation({ summary: 'Create' })
  @Post()
  @CheckPolicy('create', 'LibraryCollection')
  @ApiCreatedResponse({ type: CollectionResponseDto })
  async create(@CurrentActor() actor: Actor, @Body() dto: CreateCollectionDto) {
    const collection = await this.commandBus.execute(
      new CreateCollectionCommand(
        actor,
        actor.userId,
        dto.name,
        dto.description,
        dto.isPublic,
      ),
    );
    return CollectionResponseDto.fromResult(collection);
  }

  @ApiOperation({ summary: 'List' })
  @Public()
  @Get()
  @CheckPolicy('read', 'LibraryCollection')
  @ApiPaginatedResponse(CollectionResponseDto, 'offset')
  @HttpCode(HttpStatus.OK)
  async findAll(
    @CurrentActor() actor: Actor,
    @Query() dto: GetCollectionsQueryDto,
  ) {
    const page = await this.queryBus.execute(dto.toQuery(actor));
    return paginate(page.items, page.total, dto, (items) =>
      items.map((item) => CollectionResponseDto.fromReadModel(item)),
    );
  }

  @ApiOperation({ summary: 'Find One By Query' })
  @Public()
  @Get('detail')
  @CheckPolicy('read', 'LibraryCollection')
  @HttpCode(HttpStatus.OK)
  @ApiExtraModels(CollectionDetailResponseDto)
  @ApiOkResponse({
    schema: {
      allOf: [{ $ref: getSchemaPath(CollectionDetailResponseDto) }],
      nullable: true,
    },
  })
  async findOneByQuery(
    @CurrentActor() actor: Actor,
    @Query('userId') userId: string,
    @Query('id') id: string,
  ) {
    const result = await this.queryBus.execute(
      new GetCollectionByIdQuery(actor, userId, id),
    );
    return result
      ? CollectionDetailResponseDto.fromResultDetail(
          result.collection,
          result.books,
        )
      : null;
  }

  @ApiOperation({ summary: 'Get' })
  @Get(':id')
  @CheckPolicy('read', 'LibraryCollection')
  @HttpCode(HttpStatus.OK)
  @ApiExtraModels(CollectionDetailResponseDto)
  @ApiOkResponse({
    schema: {
      allOf: [{ $ref: getSchemaPath(CollectionDetailResponseDto) }],
      nullable: true,
    },
  })
  async findOne(
    @CurrentActor() actor: Actor,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    const result = await this.queryBus.execute(
      new GetCollectionByIdQuery(actor, actor.userId, id),
    );
    return result
      ? CollectionDetailResponseDto.fromResultDetail(
          result.collection,
          result.books,
        )
      : null;
  }

  @ApiOperation({ summary: 'Update' })
  @Patch(':id')
  @CheckPolicy('update', 'LibraryCollection')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: CollectionResponseDto })
  async update(
    @CurrentActor() actor: Actor,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: UpdateCollectionDto,
  ) {
    const command = new UpdateCollectionCommand(
      actor,
      id,
      dto.name,
      dto.description,
      dto.isPublic,
    );
    const collection = await this.commandBus.execute(command);
    return CollectionResponseDto.fromResult(collection);
  }

  @ApiOperation({ summary: 'Delete' })
  @HttpCode(204)
  @Delete(':id')
  @CheckPolicy('delete', 'LibraryCollection')
  @ApiNoContentResponse()
  async remove(
    @CurrentActor() actor: Actor,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    await this.commandBus.execute(new DeleteCollectionCommand(actor, id));
    return undefined;
  }
}
