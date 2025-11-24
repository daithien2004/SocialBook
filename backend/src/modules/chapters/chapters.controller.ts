import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ChaptersService } from './chapters.service';

// Guards & Decorators
import { Public } from '@/src/common/decorators/customize';
import { Roles } from '@/src/common/decorators/roles.decorator';
import { JwtAuthGuard } from '@/src/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/src/common/guards/roles.guard';

// DTOs
import { CreateChapterDto } from './dto/create-chapter.dto';
import { UpdateChapterDto } from './dto/update-chapter.dto';

@Controller('books/:bookSlug/chapters')
export class ChaptersController {
  constructor(private readonly chaptersService: ChaptersService) {}

  @Public()
  @Get()
  @HttpCode(HttpStatus.OK)
  async getChapters(@Param('bookSlug') bookSlug: string) {
    const result = await this.chaptersService.findByBookSlug(bookSlug);
    return {
      message: 'Get list chapters successfully',
      data: result,
    };
  }

  @Post()
  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Param('bookSlug') bookSlug: string,
    @Body() dto: CreateChapterDto,
    @Request() req: any,
  ) {
    const data = await this.chaptersService.create(bookSlug, dto, req.user.id);
    return {
      message: 'Create chapter successfully',
      data,
    };
  }

  @Get('id/:id')
  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  async getById(@Param('id') id: string) {
    const data = await this.chaptersService.findById(id);
    return {
      message: 'Get chapter by ID successfully',
      data,
    };
  }

  @Put(':id')
  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  async update(@Param('id') id: string, @Body() dto: UpdateChapterDto) {
    const data = await this.chaptersService.update(id, dto);
    return {
      message: 'Update chapter successfully',
      data,
    };
  }

  @Delete(':id')
  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HttpCode(HttpStatus.OK)
  async delete(@Param('id') id: string) {
    const result = await this.chaptersService.delete(id);
    return {
      message: result.message,
    };
  }

  @Public()
  @Get(':chapterSlug')
  @HttpCode(HttpStatus.OK)
  async getDetail(
    @Param('bookSlug') bookSlug: string,
    @Param('chapterSlug') chapterSlug: string,
  ) {
    const result = await this.chaptersService.findBySlug(bookSlug, chapterSlug);
    return {
      message: 'Get chapter detail successfully',
      data: result,
    };
  }
}
