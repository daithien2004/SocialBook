import { ApiTags } from '@nestjs/swagger';
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
  ParseUUIDPipe,
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
import { ApiNoContentResponse, ApiOperation } from '@nestjs/swagger';

@ApiProblemResponses()
@ApiTags('Text to Speech')
@Controller('text-to-speech')
export class TextToSpeechController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @ApiOperation({ summary: 'Generate Chapter Audio' })
  @Roles('admin')
  @UseGuards(RolesGuard)
  @Post('chapter/:chapterId')
  async generateChapterAudio(
    @Param('chapterId', new ParseUUIDPipe({ version: '4' })) chapterId: string,
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

  @ApiOperation({ summary: 'Generate Book Audio' })
  @Roles('admin')
  @UseGuards(RolesGuard)
  @Post('book/:bookId/all')
  async generateBookAudio(
    @Param('bookId', new ParseUUIDPipe({ version: '4' })) bookId: string,
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

  @ApiOperation({ summary: 'Get Chapter Audio' })
  @Public()
  @Get('chapter/:chapterId')
  async getChapterAudio(
    @Param('chapterId', new ParseUUIDPipe({ version: '4' })) chapterId: string,
  ) {
    const query = new GetChapterAudioQuery(chapterId);
    const result = await this.queryBus.execute(query);

    if (!result) {
      return null;
    }

    return TextToSpeechResponseDto.fromEntity(result);
  }

  @ApiOperation({ summary: 'Delete Chapter Audio' })
  @HttpCode(204)
  @Roles('admin')
  @UseGuards(RolesGuard)
  @Delete('chapter/:chapterId')
  async deleteChapterAudio(
    @Param('chapterId', new ParseUUIDPipe({ version: '4' })) chapterId: string,
  ) {
    const command = new DeleteChapterAudioCommand(chapterId);
    await this.commandBus.execute(command);
  }

  @ApiOperation({ summary: 'Increment Play Count' })
  @Public()
  @Post('chapter/:chapterId/play')
  @HttpCode(204)
  @ApiNoContentResponse()
  async incrementPlayCount(
    @Param('chapterId', new ParseUUIDPipe({ version: '4' })) chapterId: string,
  ) {
    const command = new IncrementPlayCountCommand(chapterId);
    await this.commandBus.execute(command);
  }
}
