import { PaginatedResult, PaginationOptions } from '@/common/interfaces/pagination.interface';
import { AIRequest, AIRequestType } from '@/domain/gemini/entities/ai-request.entity';
import { AIRequestFilter, IAIRequestRepository } from '@/domain/gemini/repositories/ai-request.repository.interface';
import { AIRequestId } from '@/domain/gemini/value-objects/ai-request-id.vo';
import { UserId } from '@/domain/gemini/value-objects/user-id.vo';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { AIRequestDocument, AIRequest as AIRequestModelClass } from '../../schemas/ai-request.schema';

interface AIRequestPersistence {
    _id: Types.ObjectId;
    prompt: string;
    response: string | null;
    type: AIRequestType;
    userId: string;
    metadata: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}

import { BaseMongoRepository } from '@/shared/infrastructure/base-mongo.repository';

@Injectable()
export class AIRequestRepository extends BaseMongoRepository<AIRequest, AIRequestDocument, AIRequestId> implements IAIRequestRepository {
    constructor(@InjectModel(AIRequestModelClass.name) private readonly aiRequestModel: Model<AIRequestDocument>) {
        super(aiRequestModel);
    }

    protected toDomain(doc: AIRequestDocument): AIRequest {
        return AIRequest.reconstitute({
            id: doc._id.toString(),
            prompt: doc.prompt,
            response: doc.response || null,
            type: doc.type,
            userId: doc.userId,
            metadata: doc.metadata || {},
            createdAt: doc.createdAt as Date,
            updatedAt: doc.updatedAt as Date
        });
    }

    protected toPersistence(request: AIRequest): AIRequestPersistence {
        return {
            _id: new Types.ObjectId(request.id.toString()),
            prompt: request.prompt,
            response: request.response,
            type: request.type,
            userId: request.userId.toString(),
            metadata: request.metadata,
            createdAt: request.createdAt,
            updatedAt: request.updatedAt
        };
    }

    async save(request: AIRequest): Promise<void> {
        return this.baseSave(request);
    }

    async findById(id: AIRequestId): Promise<AIRequest | null> {
        const doc = await this.aiRequestModel.findById(id.toString()).exec();
        return doc ? this.toDomain(doc) : null;
    }

    async findByUserId(userId: UserId, pagination: PaginationOptions = { page: 1, limit: 10 }): Promise<PaginatedResult<AIRequest>> {
        const query: FilterQuery<AIRequestDocument> = { userId: userId.toString() };

        const skip = (pagination.page - 1) * pagination.limit;

        const [docs, total] = await Promise.all([
            this.aiRequestModel.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(pagination.limit)
                .exec(),
            this.aiRequestModel.countDocuments(query).exec()
        ]);

        return {
            data: docs.map(doc => this.toDomain(doc)),
            meta: this.buildMeta(pagination.page, pagination.limit, total),
        };
    }

    async findByType(type: AIRequestType, pagination: PaginationOptions = { page: 1, limit: 10 }): Promise<PaginatedResult<AIRequest>> {
        const query: FilterQuery<AIRequestDocument> = { type };

        const skip = (pagination.page - 1) * pagination.limit;

        const [docs, total] = await Promise.all([
            this.aiRequestModel.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(pagination.limit)
                .exec(),
            this.aiRequestModel.countDocuments(query).exec()
        ]);

        return {
            data: docs.map(doc => this.toDomain(doc)),
            meta: this.buildMeta(pagination.page, pagination.limit, total),
        };
    }

    async findAll(filter: AIRequestFilter, pagination: PaginationOptions): Promise<PaginatedResult<AIRequest>> {
        const query: FilterQuery<AIRequestDocument> = {};

        if (filter.type) {
            query.type = filter.type;
        }

        if (filter.userId) {
            query.userId = filter.userId;
        }

        if (filter.isCompleted !== undefined) {
            query.response = filter.isCompleted ? { $ne: null } : null;
        }

        if (filter.dateFrom || filter.dateTo) {
            query.createdAt = {};
            if (filter.dateFrom) {
                query.createdAt.$gte = filter.dateFrom;
            }
            if (filter.dateTo) {
                query.createdAt.$lte = filter.dateTo;
            }
        }

        const skip = (pagination.page - 1) * pagination.limit;

        const [docs, total] = await Promise.all([
            this.aiRequestModel.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(pagination.limit)
                .exec(),
            this.aiRequestModel.countDocuments(query).exec()
        ]);

        return {
            data: docs.map(doc => this.toDomain(doc)),
            meta: this.buildMeta(pagination.page, pagination.limit, total),
        };
    }

    async delete(id: AIRequestId): Promise<void> {
        return this.baseDelete(id);
    }

    async countByUserId(userId: UserId): Promise<number> {
        return await this.aiRequestModel.countDocuments({ userId: userId.toString() }).exec();
    }

    async countByType(type: AIRequestType): Promise<number> {
        return await this.aiRequestModel.countDocuments({ type }).exec();
    }

    async count(filter?: AIRequestFilter): Promise<number> {
        const query: FilterQuery<AIRequestDocument> = {};

        if (filter) {
            if (filter.type) query.type = filter.type;
            if (filter.userId) query.userId = filter.userId;
            if (filter.isCompleted !== undefined) {
                query.response = filter.isCompleted ? { $ne: null } : null;
            }
            if (filter.dateFrom || filter.dateTo) {
                query.createdAt = {};
                if (filter.dateFrom) query.createdAt.$gte = filter.dateFrom;
                if (filter.dateTo) query.createdAt.$lte = filter.dateTo;
            }
        }

        return await this.aiRequestModel.countDocuments(query).exec();
    }

    async existsById(id: AIRequestId): Promise<boolean> {
        const result = await this.aiRequestModel.exists({ _id: id.toString() });
        return !!result;
    }
}

