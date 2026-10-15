import { ApiProperty } from '@nestjs/swagger';
import type {
  GenerateTextResult,
  SummarizeChapterResult,
} from '@/modules/ai/application/ai.result';

export class GenerateTextResponseDto {
  @ApiProperty()
  response!: string;

  @ApiProperty()
  requestId!: string;

  @ApiProperty()
  responseLength!: number;

  static fromResult(result: GenerateTextResult): GenerateTextResponseDto {
    const response = new GenerateTextResponseDto();
    response.response = result.response;
    response.requestId = result.requestId;
    response.responseLength = result.responseLength;
    return response;
  }
}

export class SummarizeChapterResponseDto {
  @ApiProperty()
  summary!: string;

  @ApiProperty()
  requestId!: string;

  @ApiProperty()
  chapterId!: string;

  @ApiProperty()
  summaryLength!: number;

  static fromResult(
    result: SummarizeChapterResult,
  ): SummarizeChapterResponseDto {
    const response = new SummarizeChapterResponseDto();
    response.summary = result.summary;
    response.requestId = result.requestId;
    response.chapterId = result.chapterId;
    response.summaryLength = result.summaryLength;
    return response;
  }
}
