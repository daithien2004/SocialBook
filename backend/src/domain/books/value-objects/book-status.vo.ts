export class BookStatus {
    private readonly value: 'draft' | 'published' | 'completed';

    private constructor(status: 'draft' | 'published' | 'completed') {
        this.value = status;
    }

    static create(status: string): BookStatus {
        const validStatuses = ['draft', 'published', 'completed'];
        
        if (!status || !validStatuses.includes(status)) {
            throw new Error('Book status must be draft, published, or completed');
        }

        return new BookStatus(status as 'draft' | 'published' | 'completed');
    }

    static draft(): BookStatus {
        return new BookStatus('draft');
    }

    static published(): BookStatus {
        return new BookStatus('published');
    }

    static completed(): BookStatus {
        return new BookStatus('completed');
    }

    toString(): string {
        return this.value;
    }

    isDraft(): boolean {
        return this.value === 'draft';
    }

    isPublished(): boolean {
        return this.value === 'published';
    }

    isCompleted(): boolean {
        return this.value === 'completed';
    }

    getValue(): string {
        return this.value;
    }
}
