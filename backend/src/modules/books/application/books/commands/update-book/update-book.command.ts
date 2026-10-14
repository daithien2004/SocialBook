import { Command } from '@nestjs/cqrs';
import type { MediaUploadFile } from '@/modules/media/domain/public-api';
import type { Actor } from '@/shared/casl/actor';

export class UpdateBookCommand extends Command<string> {
  public readonly actor: Actor;
  public readonly id: string;
  public readonly title?: string;
  public readonly authorId?: string;
  public readonly genres?: string[];
  public readonly description?: string;
  public readonly publishedYear?: string;
  public readonly coverUrl?: string;
  public readonly coverFile?: MediaUploadFile;
  public readonly status?: 'draft' | 'published' | 'completed';
  public readonly tags?: string[];

  constructor(props: {
    actor: Actor;
    id: string;
    title?: string;
    authorId?: string;
    genres?: string[];
    description?: string;
    publishedYear?: string;
    coverUrl?: string;
    coverFile?: MediaUploadFile;
    status?: 'draft' | 'published' | 'completed';
    tags?: string[];
  }) {
    super();
    this.actor = props.actor;
    this.id = props.id;
    this.title = props.title;
    this.authorId = props.authorId;
    this.genres = props.genres;
    this.description = props.description;
    this.publishedYear = props.publishedYear;
    this.coverUrl = props.coverUrl;
    this.coverFile = props.coverFile;
    this.status = props.status;
    this.tags = props.tags;
  }
}
