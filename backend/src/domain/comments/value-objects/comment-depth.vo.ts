export class CommentDepth {
    static readonly MAX_LEVEL = 3;

    private constructor(private readonly _value: number) { }

    static create(value: number): CommentDepth {
        if (value < 1 || value > CommentDepth.MAX_LEVEL) {
            throw new Error(
                `Comment depth must be between 1 and ${CommentDepth.MAX_LEVEL}, got ${value}`,
            );
        }
        return new CommentDepth(value);
    }

    static root(): CommentDepth {
        return new CommentDepth(1);
    }

    static maxAllowed(): CommentDepth {
        return new CommentDepth(CommentDepth.MAX_LEVEL);
    }

    get value(): number {
        return this._value;
    }

    isRoot(): boolean {
        return this._value === 1;
    }

    isMaxDepth(): boolean {
        return this._value === CommentDepth.MAX_LEVEL;
    }

    toString(): string {
        return this._value.toString();
    }
}
