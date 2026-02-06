import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post, Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { CollectionsService } from './collections.service';
import { CreateCollectionDto, UpdateCollectionDto } from './dto/collection.dto';
import { JwtAuthGuard } from '@/src/common/guards/jwt-auth.guard';
import { Public } from '@/src/common/decorators/customize';

@Controller('collections')
@UseGuards(JwtAuthGuard)
export class CollectionsController {
  constructor(private readonly collectionsService: CollectionsService) { }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Req() req: Request & { user: { id: string } }, @Body() dto: CreateCollectionDto) {
    const data = await this.collectionsService.create(req.user.id, dto);
    return {
      message: 'Create collection successfully',
      data,
    };
  }

  @Public()
  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(@Query('userId') userId: string) {
    const data = await this.collectionsService.findAll(userId);
    return {
      message: 'Get all collections successfully',
      data,
    };
  }

  @Public()
  @Get('detail')
  @HttpCode(HttpStatus.OK)
  async findOneByQuery(
    @Query('userId') userId: string,
    @Query('id') id: string,
  ) {
    const data = await this.collectionsService.findOneWithBooks(userId, id);

    return {
      message: 'Get collection detail successfully',
      data,
    };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(@Req() req: Request & { user: { id: string } }, @Param('id') id: string) {
    const data = await this.collectionsService.findOneWithBooks(
      req.user.id,
      id,
    );
    return {
      message: 'Get collection detail successfully',
      data,
    };
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async update(
    @Req() req: Request & { user: { id: string } },
    @Param('id') id: string,
    @Body() dto: UpdateCollectionDto,
  ) {
    const data = await this.collectionsService.update(req.user.id, id, dto);
    return {
      message: 'Update collection successfully',
      data,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Req() req: Request & { user: { id: string } }, @Param('id') id: string) {
    await this.collectionsService.remove(req.user.id, id);
    return {
      message: 'Delete collection successfully',
    };
  }
}
