import { Command } from '@nestjs/cqrs';

import { ChapterReadModel } from '@/modules/chapters/application/read-models/chapter.read-model';
import type { Actor } from '@/shared/casl/actor';

interface UpdateChapterCommandProps {
  actor: Actor;
  id: string;
  title?: string;
  bookId?: string;
  paragraphs?: Array<{ id?: string; content: string }>;
  slug?: string;
  orderIndex?: number;
}

export class UpdateChapterCommand extends Command<ChapterReadModel> {
  public readonly actor: Actor;
  public readonly id: string;
  public readonly title?: string;
  public readonly bookId?: string;
  public readonly paragraphs?: Array<{ id?: string; content: string }>;
  public readonly slug?: string;
  public readonly orderIndex?: number;

  constructor(props: UpdateChapterCommandProps) {
    super();
    this.actor = props.actor;
    this.id = props.id;
    this.title = props.title;
    this.bookId = props.bookId;
    this.paragraphs = props.paragraphs;
    this.slug = props.slug;
    this.orderIndex = props.orderIndex;
  }
}
