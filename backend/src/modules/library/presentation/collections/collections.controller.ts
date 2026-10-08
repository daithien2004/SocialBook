import { unpaginated } from '@/shared/platform/dto/paginated.dto';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { UpdateCollectionCommand } from '@/modules/library/application/library/commands/update-collection/update-collection.command';
import { GetCollectionByIdQuery } from '@/modules/library/application/library/queries/get-collection-by-id/get-collection-by-id.query';
import { GetAllCollectionsQuery } from '@/modules/library/application/library/queries/get-all-collections/get-all-collections.query';
import { DeleteCollectionCommand } from '@/modules/library/application/library/commands/delete-collection/delete-collection.command';
import { CreateCollectionCommand } from '@/modules/library/application/library/commands/create-collection/create-collection.command';

import { Public } from '@/shared/platform/decorators/custom.decorator';
import { CurrentUser } from '@/shared/platform/decorators/current-user.decorator';
import { CurrentAbility } from '@/shared/platform/decorators/current-ability.decorator';
import type { AppAbility } from '@socialbook/shared';
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
  Req,
} from '@nestjs/common';
import { Request } from 'express';
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
} from '@nestjs/swagger';

@ApiProblemResponses()
@Controller('collections')
export class CollectionsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @ApiCreatedResponse({ type: CollectionResponseDto })
  async create(
    @Req() req: Request & { user: { id: string } },
    @Body() dto: CreateCollectionDto,
  ) {
    const collection = await this.commandBus.execute(
      new CreateCollectionCommand(
        req.user.id,
        dto.name,
        dto.description,
        dto.isPublic,
      ),
    );
    return CollectionResponseDto.fromResult(collection);
  }

  @Public()
  @Get()
  @ApiPaginatedResponse(CollectionResponseDto, 'offset')
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Query('userId') userId?: string,
    @CurrentUser('id') viewerId?: string,
  ) {
    const results = await this.queryBus.execute(
      new GetAllCollectionsQuery(userId || '', viewerId),
    );
    return unpaginated(
      results.map((r) =>
        CollectionResponseDto.fromResult(r.collection, r.bookCount),
      ),
    );
  }

  @Public()
  @Get('detail')
  @HttpCode(HttpStatus.OK)
  @ApiExtraModels(CollectionDetailResponseDto)
  @ApiOkResponse({
    schema: {
      allOf: [{ $ref: getSchemaPath(CollectionDetailResponseDto) }],
      nullable: true,
    },
  })
  async findOneByQuery(
    @Query('userId') userId: string,
    @Query('id') id: string,
  ) {
    const result = await this.queryBus.execute(
      new GetCollectionByIdQuery(userId, id),
    );
    return result
      ? CollectionDetailResponseDto.fromResultDetail(
          result.collection,
          result.books,
        )
      : null;
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiExtraModels(CollectionDetailResponseDto)
  @ApiOkResponse({
    schema: {
      allOf: [{ $ref: getSchemaPath(CollectionDetailResponseDto) }],
      nullable: true,
    },
  })
  async findOne(
    @Req() req: Request & { user: { id: string } },
    @Param('id') id: string,
  ) {
    const result = await this.queryBus.execute(
      new GetCollectionByIdQuery(req.user.id, id),
    );
    return result
      ? CollectionDetailResponseDto.fromResultDetail(
          result.collection,
          result.books,
        )
      : null;
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: CollectionResponseDto })
  async update(
    @Req() req: Request & { user: { id: string } },
    @Param('id') id: string,
    @CurrentAbility() ability: AppAbility,
    @Body() dto: UpdateCollectionDto,
  ) {
    const command = new UpdateCollectionCommand(
      id,
      req.user.id,
      ability,
      dto.name,
      dto.description,
      dto.isPublic,
    );
    const collection = await this.commandBus.execute(command);
    return CollectionResponseDto.fromResult(collection);
  }

  @HttpCode(204)
  @Delete(':id')
  @ApiNoContentResponse()
  async remove(
    @Req() req: Request & { user: { id: string } },
    @Param('id') id: string,
    @CurrentAbility() ability: AppAbility,
  ) {
    await this.commandBus.execute(
      new DeleteCollectionCommand(id, req.user.id, ability),
    );
    return undefined;
  }
}
