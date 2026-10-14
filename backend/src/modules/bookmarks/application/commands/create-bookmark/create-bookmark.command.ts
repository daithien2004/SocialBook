import { Command } from '@nestjs/cqrs';
import type { Actor } from '@/shared/casl/actor';

export interface CreateBookmarkInput {
  bookId: string;
  chapterId: string;
  chapterSlug: string;
  paragraphId: string;
  textPreview: string;
}

export class CreateBookmarkCommand extends Command<string> {
  constructor(
    public readonly actor: Actor,
    public readonly input: CreateBookmarkInput,
  ) {
    super();
  }
}
