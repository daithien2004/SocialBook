import { Entity } from '@/shared/domain/entity.base';
import { AchievementId } from '../value-objects/achievement-id.vo';
import { AchievementCode } from '../value-objects/achievement-code.vo';

export type AchievementCategory =
  | 'reading'
  | 'streak'
  | 'social'
  | 'special'
  | 'onboarding';

export interface AchievementRequirement {
  type:
    | 'books_completed'
    | 'pages_read'
    | 'streak_days'
    | 'reviews_written'
    | 'custom'
    | 'onboarding';
  value: number;
  condition?: string;
}

export interface AchievementProps {
  code: AchievementCode;
  name: string;
  description: string;
  category: AchievementCategory;
  requirement: AchievementRequirement;
  isActive: boolean;
}

export class Achievement extends Entity<AchievementId> {
  private _props: AchievementProps;

  private constructor(
    id: AchievementId,
    props: AchievementProps,
    createdAt?: Date,
    updatedAt?: Date,
  ) {
    super(id, createdAt, updatedAt);
    this._props = props;
  }

  static create(props: {
    id: AchievementId;
    code: string;
    name: string;
    description: string;
    category: AchievementCategory;
    requirement: AchievementRequirement;
  }): Achievement {
    return new Achievement(props.id, {
      code: AchievementCode.create(props.code),
      name: props.name.trim(),
      description: props.description.trim(),
      category: props.category,
      requirement: props.requirement,
      isActive: true,
    });
  }

  static reconstitute(props: {
    id: string;
    code: string;
    name: string;
    description: string;
    category: AchievementCategory;
    requirement: AchievementRequirement;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): Achievement {
    return new Achievement(
      AchievementId.create(props.id),
      {
        code: AchievementCode.create(props.code),
        name: props.name,
        description: props.description,
        category: props.category,
        requirement: props.requirement,
        isActive: props.isActive,
      },
      props.createdAt,
      props.updatedAt,
    );
  }

  get code(): AchievementCode {
    return this._props.code;
  }
  get name(): string {
    return this._props.name;
  }
  get description(): string {
    return this._props.description;
  }
  get category(): AchievementCategory {
    return this._props.category;
  }
  get requirement(): AchievementRequirement {
    return this._props.requirement;
  }
  get isActive(): boolean {
    return this._props.isActive;
  }

  updateName(name: string): void {
    this._props.name = name.trim();
    this.markAsUpdated();
  }

  updateDescription(description: string): void {
    this._props.description = description.trim();
    this.markAsUpdated();
  }

  updateRequirement(requirement: AchievementRequirement): void {
    this._props.requirement = requirement;
    this.markAsUpdated();
  }

  activate(): void {
    this._props.isActive = true;
    this.markAsUpdated();
  }

  deactivate(): void {
    this._props.isActive = false;
    this.markAsUpdated();
  }

  checkUnlockCondition(progress: number): boolean {
    return progress >= this._props.requirement.value && this._props.isActive;
  }

  getProgressPercentage(currentValue: number): number {
    return Math.min(100, (currentValue / this._props.requirement.value) * 100);
  }
}
