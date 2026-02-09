import { Types } from 'mongoose';

export class NotificationId {
    private readonly value: string;

    private constructor(id: string) {
        this.value = id;
    }

    static create(id: string): NotificationId {
        if (!id || id.trim().length === 0) {
            throw new Error('Notification ID cannot be empty');
        }

        if (!Types.ObjectId.isValid(id)) {
            throw new Error('Invalid Notification ID format');
        }

        return new NotificationId(id);
    }

    static generate(): NotificationId {
        return new NotificationId(new Types.ObjectId().toString());
    }

    toString(): string {
        return this.value;
    }

    getValue(): string {
        return this.value;
    }

    equals(other: NotificationId): boolean {
        return this.value === other.value;
    }
}
