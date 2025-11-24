import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TextToSpeechService } from './textToSpeech.service';
import {
  TextToSpeechDto,
  GenerateChapterAudioDto,
  GenerateBookAudioDto,
} from './dto/textToSpeech.dto';
import { Public } from '@/src/common/decorators/customize';
import { Roles } from '@/src/common/decorators/roles.decorator';
import { RolesGuard } from '@/src/common/guards/roles.guard';
import { JwtAuthGuard } from '@/src/common/guards/jwt-auth.guard';

@Controller('text-to-speech')
export class TextToSpeechController {
  constructor(private readonly ttsService: TextToSpeechService) { }

  /**
   * Legacy endpoint - generate speech from text (public)
   */
  @Public()
  @Post()
  @HttpCode(HttpStatus.OK)
  async generateSpeech(@Body() dto: TextToSpeechDto) {
    const audioUrl = await this.ttsService.generate(dto);

    return {
      message: 'Generated speech successfully',
      data: audioUrl,
    };
  }

  /**
   * Generate audio for a single chapter (admin only)
   */
  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('chapter/:chapterId')
  @HttpCode(HttpStatus.OK)
  async generateChapterAudio(
    @Param('chapterId') chapterId: string,
    @Body() dto: GenerateChapterAudioDto,
  ) {
    const result = await this.ttsService.generateAudioForChapter(
      chapterId,
      dto,
    );

    return {
      message: 'Audio generated successfully',
      data: result,
    };
  }

  /**
   * Generate audio for all chapters in a book (admin only)
   */
  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('book/:bookId/all')
  @HttpCode(HttpStatus.OK)
  async generateBookAudio(
    @Param('bookId') bookId: string,
    @Body() dto: GenerateBookAudioDto,
  ) {
    const result = await this.ttsService.generateAudioForAllChapters(
      bookId,
      dto,
    );

    return {
      message: 'Batch audio generation completed',
      data: result,
    };
  }

  /**
   * Get TTS by chapter ID (public)
   */
  @Public()
  @Get('chapter/:chapterId')
  async getChapterAudio(@Param('chapterId') chapterId: string) {
    const result = await this.ttsService.getAudioByChapterId(chapterId);

    if (!result) {
      return {
        message: 'No audio found for this chapter',
        data: null,
      };
    }

    return {
      message: 'Audio retrieved successfully',
      data: result,
    };
  }

  /**
   * Delete TTS for a chapter (admin only)
   */
  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Delete('chapter/:chapterId')
  async deleteChapterAudio(@Param('chapterId') chapterId: string) {
    const result = await this.ttsService.deleteAudio(chapterId);

    return {
      message: 'Audio deleted successfully',
      data: result,
    };
  }

  /**
   * Increment play count (public)
   */
  @Public()
  @Post('chapter/:chapterId/play')
  @HttpCode(HttpStatus.OK)
  async incrementPlayCount(@Param('chapterId') chapterId: string) {
    await this.ttsService.incrementPlayCount(chapterId);

    return {
      message: 'Play count incremented',
    };
  }
}

