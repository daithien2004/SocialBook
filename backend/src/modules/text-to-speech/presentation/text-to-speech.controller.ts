import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  HttpCode,
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
} from '@/modules/text-to-speech/presentation/dto/text-to-speech.dto';
import { Public } from '@/shared/platform/decorators/custom.decorator';
import { Roles } from '@/shared/platform/decorators/roles.decorator';
import { RolesGuard } from '@/shared/platform/guards/roles.guard';
import { GenerateChapterAudioCommand } from '@/modules/text-to-speech/application/commands/generate-chapter-audio/generate-chapter-audio.command';
import { GetChapterAudioQuery } from '@/modules/text-to-speech/application/queries/get-chapter-audio/get-chapter-audio.query';
import { DeleteChapterAudioCommand } from '@/modules/text-to-speech/application/commands/delete-chapter-audio/delete-chapter-audio.command';
import { GenerateBookAudioCommand } from '@/modules/text-to-speech/application/commands/generate-book-audio/generate-book-audio.command';
import { IncrementPlayCountCommand } from '@/modules/text-to-speech/application/commands/increment-play-count/increment-play-count.command';
import { ApiProblemResponses } from '@/shared/platform/decorators/api-response.decorators';
import { ApiNoContentResponse } from '@nestjs/swagger';

@ApiProblemResponses()
@Controller('text-to-speech')
export class TextToSpeechController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

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
    const result = await this.commandBus.execute(command);
    return TextToSpeechResponseDto.fromEntity(result);
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
    const result = await this.commandBus.execute(command);
    return result;
  }

  @Public()
  @Get('chapter/:chapterId')
  async getChapterAudio(@Param('chapterId') chapterId: string) {
    const query = new GetChapterAudioQuery(chapterId);
    const result = await this.queryBus.execute(query);

    if (!result) {
      return null;
    }

    return TextToSpeechResponseDto.fromEntity(result);
  }

  @HttpCode(204)
  @Roles('admin')
  @UseGuards(RolesGuard)
  @Delete('chapter/:chapterId')
  async deleteChapterAudio(@Param('chapterId') chapterId: string) {
    const command = new DeleteChapterAudioCommand(chapterId);
    await this.commandBus.execute(command);
  }

  @Public()
  @Post('chapter/:chapterId/play')
  @HttpCode(204)
  @ApiNoContentResponse()
  async incrementPlayCount(@Param('chapterId') chapterId: string) {
    const command = new IncrementPlayCountCommand(chapterId);
    await this.commandBus.execute(command);
  }
}
