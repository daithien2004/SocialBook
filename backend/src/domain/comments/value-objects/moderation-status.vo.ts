export class ModerationStatus {
    private readonly value: 'pending' | 'approved' | 'rejected';

    private constructor(status: 'pending' | 'approved' | 'rejected') {
        this.value = status;
    }

    static create(status: string): ModerationStatus {
        const validStatuses = ['pending', 'approved', 'rejected'];
        
        if (!status || !validStatuses.includes(status as 'pending' | 'approved' | 'rejected')) {
            throw new Error(`Moderation status must be one of: ${validStatuses.join(', ')}`);
        }

        return new ModerationStatus(status as 'pending' | 'approved' | 'rejected');
    }

    static pending(): ModerationStatus {
        return new ModerationStatus('pending');
    }

    static approved(): ModerationStatus {
        return new ModerationStatus('approved');
    }

    static rejected(): ModerationStatus {
        return new ModerationStatus('rejected');
    }

    toString(): string {
        return this.value;
    }

    isPending(): boolean {
        return this.value === 'pending';
    }

    isApproved(): boolean {
        return this.value === 'approved';
    }

    isRejected(): boolean {
        return this.value === 'rejected';
    }

    equals(other: ModerationStatus): boolean {
        return this.value === other.value;
    }

    getValue(): string {
        return this.value;
    }
}
