import { Command } from '@nestjs/cqrs';
import { ConflictDomainException } from "@/shared/domain/common-exceptions";
import { IChapterRepository } from "@/domain/chapters/repositories/chapter.repository.interface";
import { IIdGenerator } from "@/shared/domain/id-generator.interface";
import { Chapter } from "@/domain/chapters/entities/chapter.entity";
import { ChapterId } from "@/domain/chapters/value-objects/chapter-id.vo";
import { ChapterTitle } from "@/domain/chapters/value-objects/chapter-title.vo";
import { BookId } from "@/domain/chapters/value-objects/book-id.vo";

import { ChapterResult } from '@/application/chapters/queries/get-chapters/get-chapters.result';

export class CreateChapterCommand extends Command<ChapterResult> {
  constructor(
    public readonly title: string,
    public readonly bookId: string,
    public readonly paragraphs: Array<{ id?: string; content: string }>,
    public readonly slug?: string,
    public readonly orderIndex?: number,
  ) { super(); }
}
