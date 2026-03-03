import { AIRequest, AIRequestType } from '../entities/ai-request.entity';
import { AIRequestId } from '../value-objects/ai-request-id.vo';
import { UserId } from '../value-objects/user-id.vo';
import { PaginatedResult } from '@/common/interfaces/pagination.interface';

export interface AIRequestFilter {
    type?: AIRequestType;
    userId?: string;
    isCompleted?: boolean;
    dateFrom?: Date;
    dateTo?: Date;
}

export interface PaginationOptions {
    page: number;
    limit: number;
}

export interface IAIRequestRepository {
    save(request: AIRequest): Promise<void>;
    findById(id: AIRequestId): Promise<AIRequest | null>;
    findByUserId(userId: UserId, pagination?: PaginationOptions): Promise<PaginatedResult<AIRequest>>;
    findByType(type: AIRequestType, pagination?: PaginationOptions): Promise<PaginatedResult<AIRequest>>;
    findAll(filter: AIRequestFilter, pagination: PaginationOptions): Promise<PaginatedResult<AIRequest>>;
    delete(id: AIRequestId): Promise<void>;
    countByUserId(userId: UserId): Promise<number>;
    countByType(type: AIRequestType): Promise<number>;
    count(filter?: AIRequestFilter): Promise<number>;
    existsById(id: AIRequestId): Promise<boolean>;
}
