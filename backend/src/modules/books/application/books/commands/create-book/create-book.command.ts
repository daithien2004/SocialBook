import { Command } from '@nestjs/cqrs';
import type { Actor } from '@/shared/casl/actor';
import type { MediaUploadFile } from '@/modules/media/domain/public-api';

export class CreateBookCommand extends Command<string> {
  public readonly actor: Actor;
  public readonly title: string;
  public readonly authorId: string;
  public readonly authorName?: string;
  public readonly genres: string[];
  public readonly description?: string;
  public readonly publishedYear?: string;
  public readonly coverUrl?: string;
  public readonly coverFile?: MediaUploadFile;
  public readonly status?: 'draft' | 'published' | 'completed';
  public readonly tags?: string[];

  constructor(props: {
    actor: Actor;
    title: string;
    authorId: string;
    authorName?: string;
    genres: string[];
    description?: string;
    publishedYear?: string;
    coverUrl?: string;
    coverFile?: MediaUploadFile;
    status?: 'draft' | 'published' | 'completed';
    tags?: string[];
  }) {
    super();
    this.actor = props.actor;
    this.title = props.title;
    this.authorId = props.authorId;
    this.authorName = props.authorName;
    this.genres = props.genres;
    this.description = props.description;
    this.publishedYear = props.publishedYear;
    this.coverUrl = props.coverUrl;
    this.coverFile = props.coverFile;
    this.status = props.status;
    this.tags = props.tags;
  }
}
