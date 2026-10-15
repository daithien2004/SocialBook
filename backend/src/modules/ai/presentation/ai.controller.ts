import {
  Body,
  Controller,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CommandBus } from '@nestjs/cqrs';
import type { Actor } from '@/shared/casl/actor';
import { CheckPolicy } from '@/shared/casl/check-policy.decorator';
import { CurrentActor } from '@/shared/platform/decorators/current-actor.decorator';
import { Public } from '@/shared/platform/decorators/custom.decorator';
import { PoliciesGuard } from '@/shared/casl/policies.guard';
import { ApiProblemResponses } from '@/shared/platform/decorators/api-response.decorators';
import { SummarizeChapterCommand } from '@/modules/ai/application/commands/summarize-chapter/summarize-chapter.command';
import { AIThrottleGuard } from './ai-throttle.guard';
import { GenerateTextRequestDto } from './dto/generate-text.request.dto';
import {
  GenerateTextResponseDto,
  SummarizeChapterResponseDto,
} from './dto/ai.response.dto';

@ApiProblemResponses()
@ApiTags('AI')
@UseGuards(PoliciesGuard)
@Controller('ai')
export class AIController {
  constructor(private readonly commandBus: CommandBus) {}

  @ApiOperation({ summary: 'Generate text' })
  @ApiOkResponse({ type: GenerateTextResponseDto })
  @CheckPolicy('create', 'AIRequest')
  @Public()
  @UseGuards(AIThrottleGuard)
  @Post('generate-text')
  async generateText(
    @CurrentActor() actor: Actor,
    @Body() dto: GenerateTextRequestDto,
  ): Promise<GenerateTextResponseDto> {
    const result = await this.commandBus.execute(dto.toCommand(actor));
    return GenerateTextResponseDto.fromResult(result);
  }

  @ApiOperation({ summary: 'Summarize a chapter' })
  @ApiOkResponse({ type: SummarizeChapterResponseDto })
  @CheckPolicy('create', 'AIRequest')
  @Public()
  @UseGuards(AIThrottleGuard)
  @Post('summarize-chapter/:chapterId')
  async summarizeChapter(
    @CurrentActor() actor: Actor,
    @Param('chapterId', new ParseUUIDPipe({ version: '4' })) chapterId: string,
  ): Promise<SummarizeChapterResponseDto> {
    const result = await this.commandBus.execute(
      new SummarizeChapterCommand(chapterId, actor),
    );
    return SummarizeChapterResponseDto.fromResult(result);
  }
}
