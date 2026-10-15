import { ApiProperty } from '@nestjs/swagger';
import type { ImportEpubPreviewResult } from '@/modules/chapters/application/chapters/commands/import-epub-preview/import-epub-preview.result';
import type { AskChapterAiResult } from '@/modules/chapters/application/chapters/commands/ask-ai/ask-chapter-ai.result';
import type { ChaptersImportStatusResult } from '@/modules/chapters/domain/chapters/interfaces/chapters-import.port';
import type { StartChaptersImportResult } from '@/modules/chapters/domain/chapters/interfaces/chapters-import.port';

class PreviewChapterResponseDto {
  @ApiProperty()
  title!: string;

  @ApiProperty()
  content!: string;
}

class ImportFailureResponseDto {
  @ApiProperty()
  title!: string;

  @ApiProperty()
  reason!: string;
}

class ImportJobResultResponseDto {
  @ApiProperty()
  total!: number;

  @ApiProperty()
  successful!: number;

  @ApiProperty()
  failed!: number;

  @ApiProperty({ type: ImportFailureResponseDto, isArray: true })
  failures!: ImportFailureResponseDto[];
}

export class AskChapterAiResponseDto {
  @ApiProperty()
  answer!: string;

  @ApiProperty({ format: 'date-time' })
  createdAt!: Date;

  static fromResult(result: AskChapterAiResult): AskChapterAiResponseDto {
    return { answer: result.answer, createdAt: result.createdAt };
  }
}

export class ImportEpubPreviewResponseDto {
  @ApiProperty({ type: PreviewChapterResponseDto, isArray: true })
  chapters!: PreviewChapterResponseDto[];

  @ApiProperty()
  totalChapters!: number;

  static fromResult(
    result: ImportEpubPreviewResult,
  ): ImportEpubPreviewResponseDto {
    return {
      chapters: result.chapters.map((chapter) => ({
        title: chapter.title,
        content: chapter.content,
      })),
      totalChapters: result.totalChapters,
    };
  }
}

export class StartChaptersImportResponseDto {
  @ApiProperty()
  jobId!: string;

  static fromResult(
    result: StartChaptersImportResult,
  ): StartChaptersImportResponseDto {
    return { jobId: result.jobId };
  }
}

export class ChaptersImportStatusResponseDto {
  @ApiProperty({
    enum: [
      'completed',
      'failed',
      'active',
      'waiting',
      'delayed',
      'paused',
      'unknown',
    ],
  })
  state!: ChaptersImportStatusResult['state'];

  @ApiProperty({ type: Object, nullable: true })
  progress!: unknown;

  @ApiProperty({ type: ImportJobResultResponseDto, nullable: true })
  result?: ImportJobResultResponseDto;

  @ApiProperty({ nullable: true })
  failedReason?: string;

  static fromResult(
    result: ChaptersImportStatusResult,
  ): ChaptersImportStatusResponseDto {
    return {
      state: result.state,
      progress: result.progress,
      result: result.result
        ? {
            total: result.result.total,
            successful: result.result.successful,
            failed: result.result.failed,
            failures: result.result.failures.map((failure) => ({
              title: failure.title,
              reason: failure.reason,
            })),
          }
        : undefined,
      failedReason: result.failedReason,
    };
  }
}
