export class AchievementCode {
    private readonly value: string;

    private constructor(code: string) {
        this.value = code;
    }

    static create(code: string): AchievementCode {
        if (!code || code.trim().length === 0) {
            throw new Error('Achievement code cannot be empty');
        }
        if (!/^[a-z0-9_]+$/.test(code)) {
            throw new Error('Achievement code must be lowercase alphanumeric with underscores only');
        }
        return new AchievementCode(code.trim().toLowerCase());
    }

    toString(): string {
        return this.value;
    }

    equals(other: AchievementCode): boolean {
        return this.value === other.value;
    }

    getValue(): string {
        return this.value;
    }
}
