export class FollowStatus {
    private readonly value: boolean;

    private constructor(status: boolean) {
        this.value = status;
    }

    static create(status: boolean): FollowStatus {
        if (typeof status !== 'boolean') {
            throw new Error('Follow status must be a boolean');
        }

        return new FollowStatus(status);
    }

    static active(): FollowStatus {
        return new FollowStatus(true);
    }

    static inactive(): FollowStatus {
        return new FollowStatus(false);
    }

    toString(): string {
        return this.value.toString();
    }

    isActive(): boolean {
        return this.value === true;
    }

    isInactive(): boolean {
        return this.value === false;
    }

    equals(other: FollowStatus): boolean {
        return this.value === other.value;
    }

    getValue(): boolean {
        return this.value;
    }

    toggle(): FollowStatus {
        return new FollowStatus(!this.value);
    }
}
