import { Dispatcher } from '@/application/common/dispatcher';
import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';

import {
  GenerateChapterAudioDto,
  GenerateBookAudioDto,
  TextToSpeechResponseDto,
} from '@/presentation/text-to-speech/dto/text-to-speech.dto';
import { Public } from '@/common/decorators/custom.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { RolesGuard } from '@/common/guards/roles.guard';
import { GenerateChapterAudioCommand } from '@/application/text-to-speech/commands/generate-chapter-audio/generate-chapter-audio.command';
import { GetChapterAudioQuery } from '@/application/text-to-speech/queries/get-chapter-audio/get-chapter-audio.query';
import { DeleteChapterAudioCommand } from '@/application/text-to-speech/commands/delete-chapter-audio/delete-chapter-audio.command';
import { GenerateBookAudioCommand } from '@/application/text-to-speech/commands/generate-book-audio/generate-book-audio.command';
import { IncrementPlayCountCommand } from '@/application/text-to-speech/commands/increment-play-count/increment-play-count.command';

@Controller('text-to-speech')
export class TextToSpeechController {
  constructor(private readonly dispatcher: Dispatcher) {}

  @Roles('admin')
  @UseGuards(RolesGuard)
  @Post('chapter/:chapterId')
  async generateChapterAudio(
    @Param('chapterId') chapterId: string,
    @Body() dto: GenerateChapterAudioDto,
  ) {
    const command = new GenerateChapterAudioCommand(
      chapterId,
      dto.forceRegenerate,
      dto.voice,
    );
    const result = await this.dispatcher.command(command);
    return {
      message: 'Audio generated successfully',
      data: TextToSpeechResponseDto.fromEntity(result),
    };
  }

  @Roles('admin')
  @UseGuards(RolesGuard)
  @Post('book/:bookId/all')
  async generateBookAudio(
    @Param('bookId') bookId: string,
    @Body() dto: GenerateBookAudioDto,
  ) {
    const command = new GenerateBookAudioCommand(
      bookId,
      dto.forceRegenerate,
      dto.voice,
    );
    const result = await this.dispatcher.command(command);
    return {
      message: 'Batch audio generation completed',
      data: result,
    };
  }

  @Public()
  @Get('chapter/:chapterId')
  async getChapterAudio(@Param('chapterId') chapterId: string) {
    const query = new GetChapterAudioQuery(chapterId);
    const result = await this.dispatcher.query(query);

    if (!result) {
      return {
        message: 'No audio found for this chapter',
        data: null,
      };
    }

    return {
      message: 'Audio retrieved successfully',
      data: TextToSpeechResponseDto.fromEntity(result),
    };
  }

  @Roles('admin')
  @UseGuards(RolesGuard)
  @Delete('chapter/:chapterId')
  async deleteChapterAudio(@Param('chapterId') chapterId: string) {
    const command = new DeleteChapterAudioCommand(chapterId);
    await this.dispatcher.command(command);
    return {
      message: 'Audio deleted successfully',
      data: { success: true },
    };
  }

  @Public()
  @Post('chapter/:chapterId/play')
  incrementPlayCount(@Param('chapterId') chapterId: string) {
    const command = new IncrementPlayCountCommand(chapterId);
    this.dispatcher.command(command);
    return {
      message: 'Play count incremented',
    };
  }
}
