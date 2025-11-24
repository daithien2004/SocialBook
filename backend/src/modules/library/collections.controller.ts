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
  Req,
  UseGuards,
} from '@nestjs/common';
import { CollectionsService } from './collections.service';
import { CreateCollectionDto, UpdateCollectionDto } from './dto/collection.dto';
import { JwtAuthGuard } from '@/src/common/guards/jwt-auth.guard';

@Controller('collections')
@UseGuards(JwtAuthGuard)
export class CollectionsController {
  constructor(private readonly collectionsService: CollectionsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Req() req: any, @Body() dto: CreateCollectionDto) {
    const data = await this.collectionsService.create(req.user.id, dto);
    return {
      message: 'Create collection successfully',
      data,
    };
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(@Req() req: any) {
    const data = await this.collectionsService.findAll(req.user.id);
    return {
      message: 'Get all collections successfully',
      data,
    };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(@Req() req: any, @Param('id') id: string) {
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
    @Req() req: any,
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
  async remove(@Req() req: any, @Param('id') id: string) {
    await this.collectionsService.remove(req.user.id, id);
    return {
      message: 'Delete collection successfully',
    };
  }
}
