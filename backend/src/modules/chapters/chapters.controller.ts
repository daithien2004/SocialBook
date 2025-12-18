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
  Query,
  Request,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ChaptersService } from './chapters.service';
import { FileImportService } from './file-import.service';

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
  constructor(
    private readonly chaptersService: ChaptersService,
    private readonly fileImportService: FileImportService,
  ) { }

  @Public()
  @Get()
  @HttpCode(HttpStatus.OK)
  async getChapters(
    @Param('bookSlug') bookSlug: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    const result = await this.chaptersService.getChaptersByBookSlug(bookSlug, page, limit);
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
    const data = await this.chaptersService.createChapter(bookSlug, dto, req.user);
    return {
      message: 'Create chapter successfully',
      data,
    };
  }

  @Post('import/preview')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @UseInterceptors(FileInterceptor('file', {
    limits: {
      fileSize: 50 * 1024 * 1024, // 50MB
    },
    fileFilter: (req, file, callback) => {
      const allowedMimes = [
        'application/epub+zip',
        'application/epub',
        'application/x-mobipocket-ebook', // MOBI
        'application/vnd.amazon.mobi8-ebook', // AZW3
        'application/mobi', // Some browsers send this
      ];

      // Also check file extension for MOBI files (sometimes MIME type is generic)
      const fileName = file.originalname.toLowerCase();
      const isMobiFile = fileName.endsWith('.mobi') || fileName.endsWith('.azw') || fileName.endsWith('.azw3');

      if (allowedMimes.includes(file.mimetype) || isMobiFile) {
        callback(null, true);
      } else {
        console.warn(`[FileImport] Rejected file. Mime: ${file.mimetype}, Name: ${file.originalname}`);
        callback(
          new BadRequestException(`Invalid file type: ${file.mimetype}. Only EPUB and MOBI formats are allowed`),
          false
        );
      }
    }
  }))
  async importPreview(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    try {
      const chapters = await this.fileImportService.parseFile(file);
      return {
        message: 'File parsed successfully',
        data: chapters,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
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
