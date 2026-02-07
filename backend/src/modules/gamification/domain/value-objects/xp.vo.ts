export class XP {
    private readonly value: number;

    private constructor(xp: number) {
        this.value = Math.max(0, xp);
    }

    static create(xp: number): XP {
        return new XP(xp);
    }

    static zero(): XP {
        return new XP(0);
    }

    add(other: XP): XP {
        return new XP(this.value + other.value);
    }

    subtract(other: XP): XP {
        return new XP(this.value - other.value);
    }

    multiply(factor: number): XP {
        return new XP(Math.floor(this.value * factor));
    }

    getValue(): number {
        return this.value;
    }

    getLevel(): number {
        // Simple level calculation: level = floor(sqrt(xp / 100)) + 1
        return Math.floor(Math.sqrt(this.value / 100)) + 1;
    }

    getXPForNextLevel(): number {
        const currentLevel = this.getLevel();
        const xpForNextLevel = Math.pow(currentLevel, 2) * 100;
        return xpForNextLevel - this.value;
    }

    getProgressToNextLevel(): number {
        const currentLevel = this.getLevel();
        const xpForCurrentLevel = Math.pow(currentLevel - 1, 2) * 100;
        const xpForNextLevel = Math.pow(currentLevel, 2) * 100;
        const xpNeeded = xpForNextLevel - xpForCurrentLevel;
        const xpProgress = this.value - xpForCurrentLevel;
        return Math.min(100, Math.max(0, (xpProgress / xpNeeded) * 100));
    }

    equals(other: XP): boolean {
        return this.value === other.value;
    }

    isGreaterThan(other: XP): boolean {
        return this.value > other.value;
    }
}
