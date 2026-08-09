import { Injectable } from '@nestjs/common';
import { IBookRepository } from '@/domain/books/repositories/book.repository.interface';
import { IChapterRepository } from '@/domain/chapters/repositories/chapter.repository.interface';
import { BookId } from '@/domain/books/value-objects/book-id.vo';
import { ChapterId } from '@/domain/chapters/value-objects/chapter-id.vo';
import {
  ITargetTypeHandler,
  TargetResolution,
} from '../interfaces/target-type-handler.interface';

@Injectable()
export class ChapterTargetHandler implements ITargetTypeHandler {
  constructor(
    private readonly chapterRepository: IChapterRepository,
    private readonly bookRepository: IBookRepository,
  ) {}

  type(): string {
    return 'chapter';
  }

  async resolve(targetId: string): Promise<TargetResolution> {
    const chapter = await this.chapterRepository.findById(
      ChapterId.create(targetId),
    );
    if (!chapter) {
      return new TargetResolution(undefined, null);
    }

    const book = await this.bookRepository.findById(
      BookId.create(chapter.bookId.toString()),
    );
    const actionUrl = book
      ? `/books/${book.slug}/chapters/${chapter.slug}`
      : `/chapters/${chapter.id.toString()}`;

    return new TargetResolution(actionUrl, chapter.bookId.toString());
  }
}
