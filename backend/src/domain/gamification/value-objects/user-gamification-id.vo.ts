import { Types } from 'mongoose';

export class UserGamificationId {
    private readonly value: string;

    private constructor(id: string) {
        this.value = id;
    }

    static create(id: string): UserGamificationId {
        if (!id || id.trim().length === 0) {
            throw new Error('UserGamification ID cannot be empty');
        }
        if (!Types.ObjectId.isValid(id)) {
            throw new Error('Invalid UserGamification ID format');
        }
        return new UserGamificationId(id);
    }

    static generate(): UserGamificationId {
        return new UserGamificationId(new Types.ObjectId().toString());
    }

    toString(): string {
        return this.value;
    }

    equals(other: UserGamificationId): boolean {
        return this.value === other.value;
    }
}
