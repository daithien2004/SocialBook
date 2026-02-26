export class AchievementId {
    private readonly value: string;

    private constructor(id: string) {
        this.value = id;
    }

    static create(id: string): AchievementId {
        if (!id || id.trim().length === 0) {
            throw new Error('Achievement ID cannot be empty');
        }
        return new AchievementId(id.trim());
    }

    toString(): string {
        return this.value;
    }

    equals(other: AchievementId): boolean {
        if (!other) return false;
        return this.value === other.value;
    }
}
