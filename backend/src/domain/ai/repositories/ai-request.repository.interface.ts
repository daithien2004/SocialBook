import {
  PaginatedResult,
  PaginationOptions,
} from '@/shared/domain/pagination.types';
import { AIRequest, AIRequestType } from '../entities/ai-request.entity';
import { AIRequestId } from '../value-objects/ai-request-id.vo';
import { UserId } from '../value-objects/user-id.vo';

export interface AIRequestFilter {
  type?: AIRequestType;
  userId?: string;
  isCompleted?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
}

export abstract class IAIRequestRepository {
  abstract save(request: AIRequest): Promise<void>;
  abstract findById(id: AIRequestId): Promise<AIRequest | null>;
  abstract findByUserId(
    userId: UserId,
    pagination?: PaginationOptions,
  ): Promise<PaginatedResult<AIRequest>>;
  abstract findByType(
    type: AIRequestType,
    pagination?: PaginationOptions,
  ): Promise<PaginatedResult<AIRequest>>;
  abstract findAll(
    filter: AIRequestFilter,
    pagination: PaginationOptions,
  ): Promise<PaginatedResult<AIRequest>>;
  abstract delete(id: AIRequestId): Promise<void>;
  abstract countByUserId(userId: UserId): Promise<number>;
  abstract countByType(type: AIRequestType): Promise<number>;
  abstract count(filter?: AIRequestFilter): Promise<number>;
  abstract existsById(id: AIRequestId): Promise<boolean>;
}
