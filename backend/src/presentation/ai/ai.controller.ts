import { Dispatcher } from '@/application/common/dispatcher';
import {
  Controller,
  Post,
  Body,
  Param,
  Req,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';

import { GenerateTextCommand } from '@/application/ai/commands/generate-text/generate-text.command';
import { SummarizeChapterCommand } from '@/application/ai/commands/summarize-chapter/summarize-chapter.command';
import { Public } from '@/common/decorators/custom.decorator';
import { AIThrottleGuard } from '@/common/guards/ai-throttle.guard';

@Controller('ai')
export class AIController {
  constructor(
    private readonly dispatcher: Dispatcher,

    ) {}

  @Public()
  @UseGuards(AIThrottleGuard)
  @Post('generate-text')
  async generateText(
    @Body() body: { prompt: string; userId?: string },
    @Req() req: { user?: { id: string } },
  ) {
    if (!body.prompt) {
      throw new BadRequestException('Prompt is required');
    }
    const command = new GenerateTextCommand(
      body.prompt,
      req.user?.id ?? 'GUEST',
    );
    return await this.dispatcher.command(command);
  }

  @Public()
  @UseGuards(AIThrottleGuard)
  @Post('summarize-chapter/:chapterId')
  async summarizeChapter(
    @Param('chapterId') chapterId: string,
    @Body() body: { userId?: string },
    @Req() req: { user?: { id: string } },
  ) {
    if (!chapterId) {
      throw new BadRequestException('Chapter ID is required');
    }
    const command = new SummarizeChapterCommand(
      chapterId,
      req.user?.id ?? 'GUEST',
    );
    const result = await this.dispatcher.command(command);
    return { data: result, message: 'Tóm tắt chương thành công' };
  }
}
