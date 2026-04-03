import { Entity } from '@/shared/domain/entity.base';
import { TargetId } from '../value-objects/target-id.vo';
import { TargetType } from '../value-objects/target-type.vo';
import { UserId } from '../value-objects/user-id.vo';

export interface LikeProps {
  userId: UserId;
  targetId: TargetId;
  targetType: TargetType;
  status: boolean;
}

export class Like extends Entity<string> {
  private _props: LikeProps;

  private constructor(
    id: string,
    props: LikeProps,
    createdAt?: Date,
    updatedAt?: Date,
  ) {
    super(id, createdAt, updatedAt);
    this._props = props;
  }

  static create(props: {
    id: string;
    userId: string;
    targetId: string;
    targetType: TargetType;
    status?: boolean;
  }): Like {
    return new Like(props.id, {
      userId: UserId.create(props.userId),
      targetId: TargetId.create(props.targetId),
      targetType: props.targetType,
      status: props.status ?? true,
    });
  }

  static reconstitute(props: {
    id: string;
    userId: string;
    targetId: string;
    targetType: TargetType;
    status: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): Like {
    return new Like(
      props.id,
      {
        userId: UserId.create(props.userId),
        targetId: TargetId.create(props.targetId),
        targetType: props.targetType,
        status: props.status,
      },
      props.createdAt,
      props.updatedAt,
    );
  }

  get userId(): UserId {
    return this._props.userId;
  }
  get targetId(): TargetId {
    return this._props.targetId;
  }
  get targetType(): TargetType {
    return this._props.targetType;
  }
  get status(): boolean {
    return this._props.status;
  }

  toggle(): void {
    this._props.status = !this._props.status;
    this.markAsUpdated();
  }

  like(): void {
    this._props.status = true;
    this.markAsUpdated();
  }

  unlike(): void {
    this._props.status = false;
    this.markAsUpdated();
  }

  isLiked(): boolean {
    return this._props.status;
  }
}
