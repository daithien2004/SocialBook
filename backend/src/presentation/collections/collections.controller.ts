import { Dispatcher } from '@/application/common/dispatcher';
import { UpdateCollectionCommand } from '@/application/library/commands/update-collection/update-collection.command';
import { GetCollectionByIdQuery } from '@/application/library/queries/get-collection-by-id/get-collection-by-id.query';
import { GetAllCollectionsQuery } from '@/application/library/queries/get-all-collections/get-all-collections.query';
import { DeleteCollectionCommand } from '@/application/library/commands/delete-collection/delete-collection.command';
import { CreateCollectionCommand } from '@/application/library/commands/create-collection/create-collection.command';

import { Public } from '@/common/decorators/custom.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { CurrentAbility } from '@/common/decorators/current-ability.decorator';
import type { AppAbility } from '@socialbook/shared';
import {
  CreateCollectionDto,
  UpdateCollectionDto,
} from '@/presentation/library/dto/collection.dto';
import {
  CollectionDetailResponseDto,
  CollectionResponseDto,
} from '@/presentation/library/dto/library.response.dto';
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

@Controller('collections')
export class CollectionsController {
  constructor(private readonly dispatcher: Dispatcher) {}

  @Post()
  async create(
    @Req() req: Request & { user: { id: string } },
    @Body() dto: CreateCollectionDto,
  ) {
    const collection = await this.dispatcher.command(
      new CreateCollectionCommand(
        req.user.id,
        dto.name,
        dto.description,
        dto.isPublic,
      ),
    );
    return {
      message: 'Collection created successfully',
      data: CollectionResponseDto.fromResult(collection),
    };
  }

  @Public()
  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Query('userId') userId?: string,
    @CurrentUser('id') viewerId?: string,
  ) {
    const results = await this.dispatcher.query(
      new GetAllCollectionsQuery(userId || '', viewerId),
    );
    return {
      message: 'Get collections successfully',
      data: results.map((r) =>
        CollectionResponseDto.fromResult(r.collection, r.bookCount),
      ),
    };
  }

  @Public()
  @Get('detail')
  @HttpCode(HttpStatus.OK)
  async findOneByQuery(
    @Query('userId') userId: string,
    @Query('id') id: string,
  ) {
    const result = await this.dispatcher.query(
      new GetCollectionByIdQuery(userId, id),
    );
    return {
      message: 'Get collection successfully',
      data: result
        ? CollectionDetailResponseDto.fromResultDetail(
            result.collection,
            result.books,
          )
        : null,
    };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(
    @Req() req: Request & { user: { id: string } },
    @Param('id') id: string,
  ) {
    const result = await this.dispatcher.query(
      new GetCollectionByIdQuery(req.user.id, id),
    );
    return {
      message: 'Get collection successfully',
      data: result
        ? CollectionDetailResponseDto.fromResultDetail(
            result.collection,
            result.books,
          )
        : null,
    };
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
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
    const collection = await this.dispatcher.command(command);
    return {
      message: 'Collection updated successfully',
      data: CollectionResponseDto.fromResult(collection),
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(
    @Req() req: Request & { user: { id: string } },
    @Param('id') id: string,
    @CurrentAbility() ability: AppAbility,
  ) {
    await this.dispatcher.command(
      new DeleteCollectionCommand(id, req.user.id, ability),
    );
    return {
      message: 'Collection deleted successfully',
    };
  }
}
