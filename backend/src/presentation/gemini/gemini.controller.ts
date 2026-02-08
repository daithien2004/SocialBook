import {
  Controller,
  Post,
  Body,
  Param,
  BadRequestException,
} from '@nestjs/common';
import { GenerateTextUseCase } from '@/application/gemini/use-cases/generate-text/generate-text.use-case';
import { SummarizeChapterUseCase } from '@/application/gemini/use-cases/summarize-chapter/summarize-chapter.use-case';
import { Public } from '@/common/decorators/customize';

@Controller('gemini')
export class GeminiController {
  constructor(
    private readonly generateTextUseCase: GenerateTextUseCase,
    private readonly summarizeChapterUseCase: SummarizeChapterUseCase,
  ) {}

  @Public()
  @Post('generate-text')
  async generateText(@Body() body: { prompt: string; userId: string }) {
    if (!body.prompt || !body.userId) {
      throw new BadRequestException('Prompt and userId are required');
    }
    return await this.generateTextUseCase.execute({
      prompt: body.prompt,
      userId: body.userId,
    });
  }

  @Public()
  @Post('summarize-chapter/:chapterId')
  async summarizeChapter(
    @Param('chapterId') chapterId: string,
    @Body() body: { userId: string }
  ) {
    if (!chapterId || !body.userId) {
      throw new BadRequestException('Chapter ID and userId are required');
    }
    return await this.summarizeChapterUseCase.execute({
      chapterId,
      userId: body.userId,
    });
  }
}
