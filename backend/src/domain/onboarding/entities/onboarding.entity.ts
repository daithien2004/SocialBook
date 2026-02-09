import { Entity } from '@/shared/domain/entity.base';

export interface ReadingTime {
    morning: boolean;
    afternoon: boolean;
    evening: boolean;
    night: boolean;
    weekend: boolean;
}

export class Onboarding extends Entity<string> {
    private constructor(
        id: string,
        public readonly userId: string,
        private _isCompleted: boolean,
        private _currentStep: number,
        private _favoriteGenres: string[],
        private _readingGoalType: string,
        private _readingGoalTarget: number,
        private _readingGoalUnit: string,
        private _readingTime: ReadingTime,
        private _completedAt?: Date,
        createdAt?: Date,
        updatedAt?: Date,
    ) {
        super(id, createdAt, updatedAt);
    }

    get isCompleted(): boolean { return this._isCompleted; }
    get currentStep(): number { return this._currentStep; }
    get favoriteGenres(): string[] { return [...this._favoriteGenres]; }
    get readingGoalType(): string { return this._readingGoalType; }
    get readingGoalTarget(): number { return this._readingGoalTarget; }
    get readingGoalUnit(): string { return this._readingGoalUnit; }
    get readingTime(): ReadingTime { return { ...this._readingTime }; }
    get completedAt(): Date | undefined { return this._completedAt; }

    public static create(userId: string): Onboarding {
        return new Onboarding(
            crypto.randomUUID(),
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
            }
        );
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
            props.userId,
            props.isCompleted,
            props.currentStep,
            props.favoriteGenres,
            props.readingGoalType,
            props.readingGoalTarget,
            props.readingGoalUnit,
            props.readingTime,
            props.completedAt,
            props.createdAt,
            props.updatedAt
        );
    }

    public updateStep(step: number, data: any): void {
        if (this._isCompleted) return;

        if (step === 1 && data.favoriteGenres) {
            this._favoriteGenres = data.favoriteGenres;
        } else if (step === 2 && data.readingGoal) {
            this._readingGoalType = data.readingGoal.type;
            this._readingGoalTarget = data.readingGoal.amount;
            this._readingGoalUnit = data.readingGoal.unit;
        } else if (step === 3 && data.readingTime) {
            this._readingTime = data.readingTime;
        }

        this._currentStep = step + 1;
        this.markAsUpdated();
    }

    public complete(): void {
        this._isCompleted = true;
        this._completedAt = new Date();
        this.markAsUpdated();
    }
}
