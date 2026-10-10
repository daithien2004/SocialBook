import { Command } from '@nestjs/cqrs';

import { ChapterResult } from '@/modules/chapters/application/chapters/queries/get-chapters/get-chapters.result';

interface UpdateChapterCommandProps {
  id: string;
  title?: string;
  bookId?: string;
  paragraphs?: Array<{ id?: string; content: string }>;
  slug?: string;
  orderIndex?: number;
}

export class UpdateChapterCommand extends Command<ChapterResult> {
  public readonly id: string;
  public readonly title?: string;
  public readonly bookId?: string;
  public readonly paragraphs?: Array<{ id?: string; content: string }>;
  public readonly slug?: string;
  public readonly orderIndex?: number;

  constructor(props: UpdateChapterCommandProps) {
    super();
    this.id = props.id;
    this.title = props.title;
    this.bookId = props.bookId;
    this.paragraphs = props.paragraphs;
    this.slug = props.slug;
    this.orderIndex = props.orderIndex;
  }
}
