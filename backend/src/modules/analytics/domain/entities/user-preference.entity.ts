import { Entity } from '@/shared/domain/entity.base';

export interface UserPreferenceProps {
  userId: string;
  genreId: string;
  score: number;
}

export class UserPreference extends Entity<string> {
  private _props: UserPreferenceProps;

  private constructor(
    id: string,
    props: UserPreferenceProps,
    createdAt?: Date,
    updatedAt?: Date,
  ) {
    super(id, createdAt, updatedAt);
    this._props = props;
  }

  static create(props: UserPreferenceProps & { id: string }): UserPreference {
    return new UserPreference(props.id, props);
  }

  static reconstitute(
    id: string,
    props: UserPreferenceProps,
    createdAt: Date,
    updatedAt: Date,
  ): UserPreference {
    return new UserPreference(id, props, createdAt, updatedAt);
  }

  get userId(): string {
    return this._props.userId;
  }
  get genreId(): string {
    return this._props.genreId;
  }
  get score(): number {
    return this._props.score;
  }

  updateScore(delta: number): void {
    this._props.score += delta;
    this.markAsUpdated();
  }
}
