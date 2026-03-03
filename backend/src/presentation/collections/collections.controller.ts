import { CreateCollectionUseCase } from '@/application/library/use-cases/create-collection/create-collection.use-case';
import { GetAllCollectionsUseCase } from '@/application/library/use-cases/get-all-collections/get-all-collections.use-case';
import { GetCollectionByIdUseCase } from '@/application/library/use-cases/get-collection-by-id/get-collection-by-id.use-case';
import { Public } from '@/common/decorators/customize';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CreateCollectionDto, UpdateCollectionDto } from '@/presentation/library/dto/collection.dto';
import { CollectionDetailResponseDto, CollectionResponseDto } from '@/presentation/library/dto/library.response.dto';
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
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';

@Controller('collections')
@UseGuards(JwtAuthGuard)
export class CollectionsController {
  constructor(
    private readonly createCollectionUseCase: CreateCollectionUseCase,
    private readonly getAllCollectionsUseCase: GetAllCollectionsUseCase,
    private readonly getCollectionByIdUseCase: GetCollectionByIdUseCase,
  ) { }

  @Post()
  async create(@Req() req: Request & { user: { id: string } }, @Body() dto: CreateCollectionDto) {
    const collection = await this.createCollectionUseCase.execute({
      userId: req.user.id,
      name: dto.name,
      description: dto.description,
      isPublic: dto.isPublic,
    });
    return {
      message: 'Collection created successfully',
      data: CollectionResponseDto.fromResult(collection),
    };
  }

  @Public()
  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(@Query('userId') userId?: string) {
    const results = await this.getAllCollectionsUseCase.execute({ userId: userId || '' });
    return {
      message: 'Get collections successfully',
      data: results.map(r => CollectionResponseDto.fromResult(r.collection, r.bookCount)),
    };
  }

  @Public()
  @Get('detail')
  @HttpCode(HttpStatus.OK)
  async findOneByQuery(
    @Query('userId') userId: string,
    @Query('id') id: string,
  ) {
    const result = await this.getCollectionByIdUseCase.execute({
      userId,
      collectionId: id,
    });
    return {
      message: 'Get collection successfully',
      data: result ? CollectionDetailResponseDto.fromResultDetail(result.collection, result.books) : null,
    };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(@Req() req: Request & { user: { id: string } }, @Param('id') id: string) {
    const result = await this.getCollectionByIdUseCase.execute({
      userId: req.user.id,
      collectionId: id,
    });
    return {
      message: 'Get collection successfully',
      data: result ? CollectionDetailResponseDto.fromResultDetail(result.collection, result.books) : null,
    };
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async update(
    @Req() req: Request & { user: { id: string } },
    @Param('id') id: string,
    @Body() dto: UpdateCollectionDto,
  ) {
    // TODO: Implement UpdateCollectionUseCase
    return {
      message: 'Collection update not implemented yet',
      data: null,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Req() req: Request & { user: { id: string } }, @Param('id') id: string) {
    // TODO: Implement DeleteCollectionUseCase
    return {
      message: 'Collection deletion not implemented yet',
    };
  }
}
