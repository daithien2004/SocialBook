import { UserId } from '@/domain/users/value-objects/user-id.vo';

export interface RoomMemberProps {
  userId: UserId;
  role: 'host' | 'member';
  joinedAt: Date;
  leftAt?: Date;
}

export class RoomMember {
  private _props: RoomMemberProps;

  private constructor(props: RoomMemberProps) {
    this._props = props;
  }

  static create(props: { userId: string; role?: 'host' | 'member' }): RoomMember {
    return new RoomMember({
      userId: UserId.create(props.userId),
      role: props.role || 'member',
      joinedAt: new Date(),
    });
  }

  static reconstitute(props: { userId: string; role: 'host' | 'member'; joinedAt: Date; leftAt?: Date }): RoomMember {
    return new RoomMember({
      userId: UserId.create(props.userId),
      role: props.role,
      joinedAt: props.joinedAt,
      leftAt: props.leftAt,
    });
  }

  get userId(): string {
    return this._props.userId.toString();
  }

  get role(): 'host' | 'member' {
    return this._props.role;
  }

  get joinedAt(): Date {
    return this._props.joinedAt;
  }

  get leftAt(): Date | undefined {
    return this._props.leftAt;
  }

  get isActive(): boolean {
    return !this._props.leftAt;
  }

  markAsLeft(): void {
    if (!this._props.leftAt) {
      this._props.leftAt = new Date();
    }
  }

  rejoin(): void {
    this._props.leftAt = undefined;
    this._props.joinedAt = new Date();
  }

  makeHost(): void {
    this._props.role = 'host';
  }
  
  makeMember(): void {
    this._props.role = 'member';
  }
}
