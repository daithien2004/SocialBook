// src/modules/library/collections.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CollectionsService } from './collections.service';
import { CreateCollectionDto, UpdateCollectionDto } from './dto/collection.dto';
import { JwtAuthGuard } from '@/src/common/guards/jwt-auth.guard';

@Controller('collections')
@UseGuards(JwtAuthGuard)
export class CollectionsController {
  constructor(private readonly collectionsService: CollectionsService) {}

  // 1. Tạo Folder mới
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Req() req, @Body() dto: CreateCollectionDto) {
    const result = await this.collectionsService.create(req.user.id, dto);
    return {
      message: 'Create collection successfully',
      data: result,
    };
  }

  // 2. Lấy danh sách các folder (Chỉ tên)
  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(@Req() req) {
    const result = await this.collectionsService.findAll(req.user.id);
    return {
      message: 'Get all collections successfully',
      data: result,
    };
  }

  // 3. Lấy chi tiết folder + Sách bên trong
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(@Req() req, @Param('id') id: string) {
    const result = await this.collectionsService.findOneWithBooks(
      req.user.id,
      id,
    );
    return {
      message: 'Get collection detail successfully',
      data: result, // Trả về { folder: ..., books: [...] }
    };
  }

  // 4. Sửa tên folder
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async update(
    @Req() req,
    @Param('id') id: string,
    @Body() dto: UpdateCollectionDto,
  ) {
    const result = await this.collectionsService.update(req.user.id, id, dto);
    return {
      message: 'Update collection successfully',
      data: result,
    };
  }

  // 5. Xóa folder
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Req() req, @Param('id') id: string) {
    await this.collectionsService.remove(req.user.id, id);
    return {
      message: 'Delete collection successfully',
      data: null,
    };
  }
}
