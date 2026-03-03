export class Streak {
    private readonly currentStreak: number;
    private readonly longestStreak: number;

    private constructor(currentStreak: number, longestStreak: number) {
        this.currentStreak = Math.max(0, currentStreak);
        this.longestStreak = Math.max(this.currentStreak, longestStreak);
    }

    static create(currentStreak: number, longestStreak: number): Streak {
        return new Streak(currentStreak, longestStreak);
    }

    static startNew(): Streak {
        return new Streak(1, 1);
    }

    increment(): Streak {
        const newCurrent = this.currentStreak + 1;
        return new Streak(newCurrent, Math.max(newCurrent, this.longestStreak));
    }

    reset(): Streak {
        return new Streak(0, this.longestStreak);
    }

    freeze(): Streak {
        // Streak stays the same but we track that it was frozen
        return new Streak(this.currentStreak, this.longestStreak);
    }

    getCurrent(): number {
        return this.currentStreak;
    }

    getLongest(): number {
        return this.longestStreak;
    }

    isActive(): boolean {
        return this.currentStreak > 0;
    }

    hasBrokenLongest(): boolean {
        return this.currentStreak >= this.longestStreak;
    }
}
