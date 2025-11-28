import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Param,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { GeminiService } from './gemini.service';
import { Public } from '@/src/common/decorators/customize';

@Controller('gemini')
export class GeminiController {
  constructor(private readonly geminiService: GeminiService) {}

  @Public()
  @Post('analyze')
  @UseInterceptors(FileInterceptor('file'))
  async analyzePdf(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Vui lòng upload một file PDF.');
    }
    if (file.mimetype !== 'application/pdf') {
      throw new BadRequestException('Chỉ chấp nhận file định dạng PDF.');
    }

    return await this.geminiService.extractInsights(file);
  }

  @Public()
  @Post('summarize-chapter/:chapterId')
  async summarizeChapter(@Param('chapterId') chapterId: string) {
    if (!chapterId) {
      throw new BadRequestException('Chapter ID is required');
    }
    return await this.geminiService.summarizeChapter(chapterId);
  }
}
