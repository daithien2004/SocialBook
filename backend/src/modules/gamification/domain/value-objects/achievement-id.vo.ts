import { Types } from 'mongoose';

export class AchievementId {
    private readonly value: string;

    private constructor(id: string) {
        this.value = id;
    }

    static create(id: string): AchievementId {
        if (!id || id.trim().length === 0) {
            throw new Error('Achievement ID cannot be empty');
        }
        if (!Types.ObjectId.isValid(id)) {
            throw new Error('Invalid Achievement ID format');
        }
        return new AchievementId(id);
    }

    static generate(): AchievementId {
        return new AchievementId(new Types.ObjectId().toString());
    }

    toString(): string {
        return this.value;
    }

    equals(other: AchievementId): boolean {
        return this.value === other.value;
    }
}
