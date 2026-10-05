import { Command } from '@nestjs/cqrs';

export class RecordBookViewCommand extends Command<void> {
  public readonly slug: string;

  constructor(slug: string) {
    super();
    this.slug = slug;
  }
}
