import { UpdateCollectionsCommand } from '@/application/library/use-cases/update-collections/update-collections.command';
import { UpdateCollectionCommand } from '@/application/library/use-cases/update-collection/update-collection.command';
import { RemoveFromLibraryCommand } from '@/application/library/use-cases/remove-from-library/remove-from-library.command';
import { GetCollectionByIdQuery } from '@/application/library/use-cases/get-collection-by-id/get-collection-by-id.query';
import { GetAllCollectionsQuery } from '@/application/library/use-cases/get-all-collections/get-all-collections.query';
import { DeleteCollectionCommand } from '@/application/library/use-cases/delete-collection/delete-collection.command';
import { CreateCollectionCommand } from '@/application/library/use-cases/create-collection/create-collection.command';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
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
  constructor(private readonly commandBus: CommandBus, private readonly queryBus: QueryBus) {}

  @Post()
  async create(
    @Req() req: Request & { user: { id: string } },
    @Body() dto: CreateCollectionDto,
  ) {
    const collection = await this.commandBus.execute(new CreateCollectionCommand(
      req.user.id,
      dto.name,
      dto.description,
      dto.isPublic,
    ));
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
    const results = await this.queryBus.execute(new GetAllCollectionsQuery(userId || '', viewerId));
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
    const result = await this.queryBus.execute(new GetCollectionByIdQuery(userId, id));
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
    const result = await this.queryBus.execute(new GetCollectionByIdQuery(req.user.id, id));
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
    const collection = await this.commandBus.execute(command);
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
    await this.commandBus.execute(new DeleteCollectionCommand(id, req.user.id, ability));
    return {
      message: 'Collection deleted successfully',
    };
  }
}
