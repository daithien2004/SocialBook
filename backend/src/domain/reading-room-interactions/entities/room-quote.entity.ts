import { Entity } from '@/shared/domain/entity.base';
import { BadRequestDomainException } from '@/shared/domain/common-exceptions';

export interface QuoteVote {
  userId: string;
  type: 'up' | 'down';
}

export interface RoomQuoteProps {
  roomId: string;
  content: string;
  userId: string;
  chapterSlug: string;
  paragraphId: string;
  votes: QuoteVote[];
}

export class RoomQuote extends Entity<string> {
  private _props: RoomQuoteProps;

  private constructor(id: string, props: RoomQuoteProps, createdAt?: Date) {
    super(id, createdAt);
    this._props = props;
  }

  static create(props: {
    roomId: string;
    content: string;
    userId: string;
    chapterSlug: string;
    paragraphId: string;
  }): RoomQuote {
    if (!props.content.trim()) {
      throw new BadRequestDomainException(
        'Nội dung trích dẫn không được để trống',
      );
    }
    return new RoomQuote(crypto.randomUUID(), {
      ...props,
      votes: [],
    });
  }

  static reconstitute(props: {
    id: string;
    roomId: string;
    content: string;
    userId: string;
    chapterSlug: string;
    paragraphId: string;
    votes: QuoteVote[];
    createdAt: Date;
  }): RoomQuote {
    return new RoomQuote(
      props.id,
      {
        roomId: props.roomId,
        content: props.content,
        userId: props.userId,
        chapterSlug: props.chapterSlug,
        paragraphId: props.paragraphId,
        votes: props.votes,
      },
      props.createdAt,
    );
  }

  addVote(userId: string, type: 'up' | 'down'): void {
    const existing = this._props.votes.find((v) => v.userId === userId);
    if (existing) {
      existing.type = type;
    } else {
      this._props.votes.push({ userId, type });
    }
  }

  removeVote(userId: string): void {
    this._props.votes = this._props.votes.filter((v) => v.userId !== userId);
  }

  get voteCount(): number {
    const ups = this._props.votes.filter((v) => v.type === 'up').length;
    const downs = this._props.votes.filter((v) => v.type === 'down').length;
    return ups - downs;
  }

  get roomId(): string {
    return this._props.roomId;
  }
  get content(): string {
    return this._props.content;
  }
  get userId(): string {
    return this._props.userId;
  }
  get chapterSlug(): string {
    return this._props.chapterSlug;
  }
  get paragraphId(): string {
    return this._props.paragraphId;
  }
  get votes(): QuoteVote[] {
    return [...this._props.votes];
  }
}
