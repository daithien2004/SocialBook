export class UserGamificationId {
    private readonly value: string;

    private constructor(id: string) {
        this.value = id;
    }

    static create(id: string): UserGamificationId {
        if (!id || id.trim().length === 0) {
            throw new Error('UserGamification ID cannot be empty');
        }
        return new UserGamificationId(id.trim());
    }

    toString(): string {
        return this.value;
    }

    equals(other: UserGamificationId): boolean {
        if (!other) return false;
        return this.value === other.value;
    }
}
