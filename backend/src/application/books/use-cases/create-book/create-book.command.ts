export class CreateBookCommand {
  public readonly title: string;
  public readonly authorId: string;
  public readonly genres: string[];
  public readonly description?: string;
  public readonly publishedYear?: string;
  public readonly coverUrl?: string;
  public readonly status?: 'draft' | 'published' | 'completed';
  public readonly tags?: string[];

  constructor(props: {
    title: string;
    authorId: string;
    genres: string[];
    description?: string;
    publishedYear?: string;
    coverUrl?: string;
    status?: 'draft' | 'published' | 'completed';
    tags?: string[];
  }) {
    this.title = props.title;
    this.authorId = props.authorId;
    this.genres = props.genres;
    this.description = props.description;
    this.publishedYear = props.publishedYear;
    this.coverUrl = props.coverUrl;
    this.status = props.status;
    this.tags = props.tags;
  }
}
