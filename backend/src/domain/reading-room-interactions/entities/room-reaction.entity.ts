import { Entity } from '@/shared/domain/entity.base';
import {
  ReactionType,
  ReactionTypeValue,
} from '../value-objects/reaction-type.vo';

export interface RoomReactionProps {
  roomId: string;
  chapterSlug: string;
  paragraphId: string;
  userId: string;
  reactionType: ReactionTypeValue;
}

export class RoomReaction extends Entity<string> {
  private _props: RoomReactionProps;

  private constructor(id: string, props: RoomReactionProps, createdAt?: Date) {
    super(id, createdAt);
    this._props = props;
  }

  static create(props: RoomReactionProps): RoomReaction {
    ReactionType.create(props.reactionType);
    return new RoomReaction(crypto.randomUUID(), props);
  }

  static reconstitute(props: {
    id: string;
    roomId: string;
    chapterSlug: string;
    paragraphId: string;
    userId: string;
    reactionType: ReactionTypeValue;
    createdAt: Date;
  }): RoomReaction {
    return new RoomReaction(
      props.id,
      {
        roomId: props.roomId,
        chapterSlug: props.chapterSlug,
        paragraphId: props.paragraphId,
        userId: props.userId,
        reactionType: props.reactionType,
      },
      props.createdAt,
    );
  }

  get roomId(): string {
    return this._props.roomId;
  }
  get chapterSlug(): string {
    return this._props.chapterSlug;
  }
  get paragraphId(): string {
    return this._props.paragraphId;
  }
  get userId(): string {
    return this._props.userId;
  }
  get reactionType(): ReactionTypeValue {
    return this._props.reactionType;
  }
}
