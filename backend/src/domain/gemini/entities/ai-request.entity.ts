import { Entity } from '@/shared/domain/entity.base';
import { AIRequestId } from '../value-objects/ai-request-id.vo';
import { UserId } from '../value-objects/user-id.vo';

export class AIRequest extends Entity<AIRequestId> {
    private constructor(
        id: AIRequestId,
        private _prompt: string,
        private _response: string | null,
        private _type: AIRequestType,
        private _userId: UserId,
        private _metadata: Record<string, any>,
        createdAt?: Date,
        updatedAt?: Date
    ) {
        super(id, createdAt, updatedAt);
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
            props.prompt.trim(),
            null,
            props.type,
            UserId.create(props.userId),
            props.metadata || {}
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
            props.prompt,
            props.response,
            props.type,
            UserId.create(props.userId),
            props.metadata,
            props.createdAt,
            props.updatedAt
        );
    }

    get prompt(): string {
        return this._prompt;
    }

    get response(): string | null {
        return this._response;
    }

    get type(): AIRequestType {
        return this._type;
    }

    get userId(): UserId {
        return this._userId;
    }

    get metadata(): Record<string, any> {
        return this._metadata;
    }

    setResponse(response: string): void {
        this._response = response.trim();
        this.markAsUpdated();
    }

    updateMetadata(metadata: Record<string, any>): void {
        this._metadata = { ...this._metadata, ...metadata };
        this.markAsUpdated();
    }

    isCompleted(): boolean {
        return this._response !== null;
    }

    isPending(): boolean {
        return this._response === null;
    }

    getResponseLength(): number {
        return this._response ? this._response.length : 0;
    }

    hasValidPrompt(): boolean {
        return this._prompt.length > 0 && this._prompt.length <= 10000;
    }
}

export enum AIRequestType {
    TEXT_GENERATION = 'text_generation',
    JSON_GENERATION = 'json_generation',
    CHAPTER_SUMMARY = 'chapter_summary',
    BOOK_RECOMMENDATION = 'book_recommendation',
    READING_ANALYSIS = 'reading_analysis',
    KEYWORD_EXTRACTION = 'keyword_extraction',
    TITLE_GENERATION = 'title_generation'
}
