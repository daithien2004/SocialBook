import { Entity } from '@/shared/domain/entity.base';
import { AIRequestId } from '../value-objects/ai-request-id.vo';
import { UserId } from '../value-objects/user-id.vo';

export enum AIRequestType {
    TEXT_GENERATION = 'text_generation',
    JSON_GENERATION = 'json_generation',
    CHAPTER_SUMMARY = 'chapter_summary',
    BOOK_RECOMMENDATION = 'book_recommendation',
    READING_ANALYSIS = 'reading_analysis',
    KEYWORD_EXTRACTION = 'keyword_extraction',
    TITLE_GENERATION = 'title_generation'
}

export interface AIRequestProps {
    prompt: string;
    response: string | null;
    type: AIRequestType;
    userId: UserId;
    metadata: Record<string, any>;
}

export class AIRequest extends Entity<AIRequestId> {
    private _props: AIRequestProps;

    private constructor(id: AIRequestId, props: AIRequestProps, createdAt?: Date, updatedAt?: Date) {
        super(id, createdAt, updatedAt);
        this._props = props;
    }

    static create(props: {
        id: string;
        prompt: string;
        type: AIRequestType;
        userId: string;
        metadata?: Record<string, any>;
    }): AIRequest {
        return new AIRequest(
            AIRequestId.create(props.id),
            {
                prompt: props.prompt.trim(),
                response: null,
                type: props.type,
                userId: UserId.create(props.userId),
                metadata: props.metadata || {}
            }
        );
    }

    static reconstitute(props: {
        id: string;
        prompt: string;
        response: string | null;
        type: AIRequestType;
        userId: string;
        metadata: Record<string, any>;
        createdAt: Date;
        updatedAt: Date;
    }): AIRequest {
        return new AIRequest(
            AIRequestId.create(props.id),
            {
                prompt: props.prompt,
                response: props.response,
                type: props.type,
                userId: UserId.create(props.userId),
                metadata: props.metadata
            },
            props.createdAt,
            props.updatedAt
        );
    }

    get prompt(): string { return this._props.prompt; }
    get response(): string | null { return this._props.response; }
    get type(): AIRequestType { return this._props.type; }
    get userId(): UserId { return this._props.userId; }
    get metadata(): Record<string, any> { return this._props.metadata; }

    setResponse(response: string): void {
        this._props.response = response.trim();
        this.markAsUpdated();
    }

    updateMetadata(metadata: Record<string, any>): void {
        this._props.metadata = { ...this._props.metadata, ...metadata };
        this.markAsUpdated();
    }

    isCompleted(): boolean {
        return this._props.response !== null;
    }

    isPending(): boolean {
        return this._props.response === null;
    }

    getResponseLength(): number {
        return this._props.response ? this._props.response.length : 0;
    }

    hasValidPrompt(): boolean {
        return this._props.prompt.length > 0 && this._props.prompt.length <= 10000;
    }
}
