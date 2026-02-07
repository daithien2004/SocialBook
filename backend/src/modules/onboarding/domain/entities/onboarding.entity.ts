import { Types } from 'mongoose';

export class Onboarding {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public isCompleted: boolean,
    public currentStep: number,
    public favoriteGenres: string[],
    public readingGoalType: string,
    public readingGoalTarget: number,
    public readingGoalUnit: string,
    public readingTime: {
      morning: boolean;
      afternoon: boolean;
      evening: boolean;
      night: boolean;
      weekend: boolean;
    },
    public completedAt?: Date,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
  ) {}

  public static create(userId: string): Onboarding {
    return new Onboarding(
      new Types.ObjectId().toString(),
      userId,
      false,
      1,
      [],
      'daily',
      0,
      'pages',
      {
        morning: false,
        afternoon: false,
        evening: false,
        night: false,
        weekend: false,
      },
    );
  }

  public updateStep(step: number, data: any): void {
      if (this.isCompleted) return;

      if (step === 1 && data.favoriteGenres) {
          this.favoriteGenres = data.favoriteGenres;
      } else if (step === 2 && data.readingGoal) {
          this.readingGoalType = data.readingGoal.type;
          this.readingGoalTarget = data.readingGoal.amount;
          this.readingGoalUnit = data.readingGoal.unit;
      } else if (step === 3 && data.readingTime) {
          this.readingTime = data.readingTime;
      }

      this.currentStep = step + 1;
  }

  public complete(): void {
      this.isCompleted = true;
      this.completedAt = new Date();
  }
}
