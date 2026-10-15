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
  HttpStatus,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
} from '@nestjs/swagger';

import {
  GenerateChapterAudioDto,
  GenerateBookAudioDto,
  GenerateBookAudioResponseDto,
  TextToSpeechResponseDto,
} from '@/modules/text-to-speech/presentation/dto/text-to-speech.dto';
import { Public } from '@/shared/platform/decorators/custom.decorator';
import { CheckPolicy } from '@/shared/casl/check-policy.decorator';
import { PoliciesGuard } from '@/shared/casl/policies.guard';
import type { Actor } from '@/shared/casl/actor';
import { CurrentActor } from '@/shared/platform/decorators/current-actor.decorator';
import { GetChapterAudioQuery } from '@/modules/text-to-speech/application/queries/get-chapter-audio/get-chapter-audio.query';
import { DeleteChapterAudioCommand } from '@/modules/text-to-speech/application/commands/delete-chapter-audio/delete-chapter-audio.command';
import { IncrementPlayCountCommand } from '@/modules/text-to-speech/application/commands/increment-play-count/increment-play-count.command';
import { ApiProblemResponses } from '@/shared/platform/decorators/api-response.decorators';
import { ApiOperation } from '@nestjs/swagger';
import { GetAudioByIdQuery } from '../application/queries/get-audio-by-id/get-audio-by-id.query';
import { NotFoundDomainException } from '@/shared/domain/common-exceptions';

@ApiProblemResponses()
@ApiTags('Text to Speech')
@UseGuards(PoliciesGuard)
@Controller('text-to-speech')
export class TextToSpeechController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @ApiOperation({ summary: 'Generate Chapter Audio' })
  @CheckPolicy('create', 'TextToSpeech')
  @Post('chapter/:chapterId')
  @ApiCreatedResponse({ type: TextToSpeechResponseDto })
  async generateChapterAudio(
    @CurrentActor() actor: Actor,
    @Param('chapterId', new ParseUUIDPipe({ version: '4' })) chapterId: string,
    @Body() dto: GenerateChapterAudioDto,
  ): Promise<TextToSpeechResponseDto> {
    const id = await this.commandBus.execute(dto.toCommand(actor, chapterId));
    const result = await this.queryBus.execute(
      new GetAudioByIdQuery(actor, id),
    );
    if (!result) throw new NotFoundDomainException('TEXT_TO_SPEECH_NOT_FOUND');
    return TextToSpeechResponseDto.fromReadModel(result);
  }

  @ApiOperation({ summary: 'Generate Book Audio' })
  @CheckPolicy('create', 'TextToSpeech')
  @Post('book/:bookId/all')
  @ApiCreatedResponse({ type: GenerateBookAudioResponseDto })
  async generateBookAudio(
    @CurrentActor() actor: Actor,
    @Param('bookId', new ParseUUIDPipe({ version: '4' })) bookId: string,
    @Body() dto: GenerateBookAudioDto,
  ): Promise<GenerateBookAudioResponseDto> {
    const result = await this.commandBus.execute(dto.toCommand(actor, bookId));
    return GenerateBookAudioResponseDto.fromResult(result);
  }

  @ApiOperation({ summary: 'Get Chapter Audio' })
  @CheckPolicy('read', 'TextToSpeech')
  @Public()
  @Get('chapter/:chapterId')
  @ApiOkResponse({ type: TextToSpeechResponseDto })
  async getChapterAudio(
    @CurrentActor() actor: Actor,
    @Param('chapterId', new ParseUUIDPipe({ version: '4' })) chapterId: string,
  ): Promise<TextToSpeechResponseDto | null> {
    const result = await this.queryBus.execute(
      new GetChapterAudioQuery(actor, chapterId),
    );
    return result ? TextToSpeechResponseDto.fromReadModel(result) : null;
  }

  @ApiOperation({ summary: 'Delete Chapter Audio' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @CheckPolicy('delete', 'TextToSpeech')
  @Delete('chapter/:chapterId')
  @ApiNoContentResponse()
  async deleteChapterAudio(
    @CurrentActor() actor: Actor,
    @Param('chapterId', new ParseUUIDPipe({ version: '4' })) chapterId: string,
  ) {
    const command = new DeleteChapterAudioCommand(actor, chapterId);
    await this.commandBus.execute(command);
  }

  @ApiOperation({ summary: 'Increment Play Count' })
  @CheckPolicy('update', 'TextToSpeech')
  @Public()
  @Post('chapter/:chapterId/play')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  async incrementPlayCount(
    @CurrentActor() actor: Actor,
    @Param('chapterId', new ParseUUIDPipe({ version: '4' })) chapterId: string,
  ) {
    const command = new IncrementPlayCountCommand(actor, chapterId);
    await this.commandBus.execute(command);
  }
}
