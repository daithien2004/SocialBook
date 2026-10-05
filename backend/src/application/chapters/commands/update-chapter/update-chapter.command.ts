import { Command } from '@nestjs/cqrs';
import { NotFoundDomainException, ConflictDomainException } from "@/shared/domain/common-exceptions";
import { IChapterRepository } from "@/domain/chapters/repositories/chapter.repository.interface";
import { ChapterId } from "@/domain/chapters/value-objects/chapter-id.vo";
import { ChapterTitle } from "@/domain/chapters/value-objects/chapter-title.vo";
import { BookId } from "@/domain/chapters/value-objects/book-id.vo";
import { ErrorMessages } from "@/common/constants/error-messages";

import { ChapterResult } from '@/application/chapters/queries/get-chapters/get-chapters.result';

export class UpdateChapterCommand extends Command<ChapterResult> {
  constructor(
    public readonly id: string,
    public readonly title?: string,
    public readonly bookId?: string,
    public readonly paragraphs?: Array<{ id?: string; content: string }>,
    public readonly slug?: string,
    public readonly orderIndex?: number,
  ) { super(); }
}
