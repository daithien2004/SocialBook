import { Entity } from '@/shared/domain/entity.base';

export interface ReadingTime {
  morning: boolean;
  afternoon: boolean;
  evening: boolean;
  night: boolean;
  weekend: boolean;
}

export interface OnboardingProps {
  userId: string;
  isCompleted: boolean;
  currentStep: number;
  favoriteGenres: string[];
  readingGoalType: string;
  readingGoalTarget: number;
  readingGoalUnit: string;
  readingTime: ReadingTime;
  completedAt?: Date;
}

export class Onboarding extends Entity<string> {
  private _props: OnboardingProps;

  private constructor(
    id: string,
    props: OnboardingProps,
    createdAt?: Date,
    updatedAt?: Date,
  ) {
    super(id, createdAt, updatedAt);
    this._props = props;
  }

  get isCompleted(): boolean {
    return this._props.isCompleted;
  }
  get currentStep(): number {
    return this._props.currentStep;
  }
  get favoriteGenres(): string[] {
    return [...this._props.favoriteGenres];
  }
  get readingGoalType(): string {
    return this._props.readingGoalType;
  }
  get readingGoalTarget(): number {
    return this._props.readingGoalTarget;
  }
  get readingGoalUnit(): string {
    return this._props.readingGoalUnit;
  }
  get readingTime(): ReadingTime {
    return { ...this._props.readingTime };
  }
  get completedAt(): Date | undefined {
    return this._props.completedAt;
  }
  get userId(): string {
    return this._props.userId;
  }

  public static create(id: string, userId: string): Onboarding {
    return new Onboarding(id, {
      userId,
      isCompleted: false,
      currentStep: 1,
      favoriteGenres: [],
      readingGoalType: 'daily',
      readingGoalTarget: 0,
      readingGoalUnit: 'pages',
      readingTime: {
        morning: false,
        afternoon: false,
        evening: false,
        night: false,
        weekend: false,
      },
    });
  }

  public static reconstitute(props: {
    id: string;
    userId: string;
    isCompleted: boolean;
    currentStep: number;
    favoriteGenres: string[];
    readingGoalType: string;
    readingGoalTarget: number;
    readingGoalUnit: string;
    readingTime: ReadingTime;
    completedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
  }): Onboarding {
    return new Onboarding(
      props.id,
      {
        userId: props.userId,
        isCompleted: props.isCompleted,
        currentStep: props.currentStep,
        favoriteGenres: props.favoriteGenres,
        readingGoalType: props.readingGoalType,
        readingGoalTarget: props.readingGoalTarget,
        readingGoalUnit: props.readingGoalUnit,
        readingTime: props.readingTime,
        completedAt: props.completedAt,
      },
      props.createdAt,
      props.updatedAt,
    );
  }

  public updateStep(step: number, data: any): void {
    if (this._props.isCompleted) return;

    if (step === 1 && data.favoriteGenres) {
      this._props.favoriteGenres = data.favoriteGenres;
    } else if (step === 2 && data.readingGoal) {
      this._props.readingGoalType = data.readingGoal.type;
      this._props.readingGoalTarget = data.readingGoal.amount;
      this._props.readingGoalUnit = data.readingGoal.unit;
    } else if (step === 3 && data.readingTime) {
      this._props.readingTime = data.readingTime;
    }

    this._props.currentStep = step + 1;
    this.markAsUpdated();
  }

  public complete(): void {
    this._props.isCompleted = true;
    this._props.completedAt = new Date();
    this.markAsUpdated();
  }
}
