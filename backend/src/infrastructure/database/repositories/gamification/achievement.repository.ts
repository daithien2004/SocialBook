import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { Achievement, AchievementDocument } from '@/infrastructure/database/schemas/achievement.schema';
import { IAchievementRepository, AchievementFilter, PaginationOptions } from '@/domain/gamification/repositories/achievement.repository.interface';
import { Achievement as AchievementEntity } from '@/domain/gamification/entities/achievement.entity';
import { AchievementId } from '@/domain/gamification/value-objects/achievement-id.vo';
import { AchievementCode } from '@/domain/gamification/value-objects/achievement-code.vo';
import { PaginatedResult } from '@/common/interfaces/pagination.interface';

@Injectable()
export class AchievementRepository implements IAchievementRepository {
    constructor(@InjectModel(Achievement.name) private readonly achievementModel: Model<AchievementDocument>) {}

    async findById(id: AchievementId): Promise<AchievementEntity | null> {
        const document = await this.achievementModel.findById(id.toString()).lean().exec();
        return document ? this.mapToEntity(document) : null;
    }

    async findByCode(code: AchievementCode): Promise<AchievementEntity | null> {
        const document = await this.achievementModel.findOne({ code: code.toString() }).lean().exec();
        return document ? this.mapToEntity(document) : null;
    }

    async findAll(filter: AchievementFilter, pagination: PaginationOptions): Promise<PaginatedResult<AchievementEntity>> {
        const queryFilter: FilterQuery<AchievementDocument> = {};

        if (filter.category) {
            queryFilter.category = filter.category;
        }

        if (filter.isActive !== undefined) {
            queryFilter.isActive = filter.isActive;
        }

        if (filter.search) {
            queryFilter.$or = [
                { name: { $regex: filter.search, $options: 'i' } },
                { description: { $regex: filter.search, $options: 'i' } }
            ];
        }

        const page = pagination.page || 1;
        const limit = pagination.limit || 10;
        const skip = (page - 1) * limit;

        let query = this.achievementModel.find(queryFilter);
        query = query.sort({ createdAt: -1 }).skip(skip).limit(limit);

        const [documents, total] = await Promise.all([
            query.lean().exec(),
            this.achievementModel.countDocuments(queryFilter).exec()
        ]);

        return {
            data: documents.map(doc => this.mapToEntity(doc)),
            meta: {
                current: page,
                pageSize: limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    async save(achievement: AchievementEntity): Promise<void> {
        const document = this.mapToDocument(achievement);
        await this.achievementModel.findByIdAndUpdate(
            achievement.id.toString(),
            document,
            { upsert: true, new: true }
        ).exec();
    }

    async delete(id: AchievementId): Promise<void> {
        await this.achievementModel.findByIdAndDelete(id.toString()).exec();
    }

    async findByCategory(category: string): Promise<AchievementEntity[]> {
        const documents = await this.achievementModel.find({ category, isActive: true }).lean().exec();
        return documents.map(doc => this.mapToEntity(doc));
    }

    async findActive(): Promise<AchievementEntity[]> {
        const documents = await this.achievementModel.find({ isActive: true }).lean().exec();
        return documents.map(doc => this.mapToEntity(doc));
    }

    async findByRequirementType(type: string): Promise<AchievementEntity[]> {
        const documents = await this.achievementModel.find({
            'requirement.type': type,
            isActive: true
        }).lean().exec();
        return documents.map(doc => this.mapToEntity(doc));
    }

    async existsByCode(code: AchievementCode): Promise<boolean> {
        const count = await this.achievementModel.countDocuments({ code: code.toString() }).exec();
        return count > 0;
    }

    async countByCategory(): Promise<Record<string, number>> {
        const result = await this.achievementModel.aggregate([
            { $match: { isActive: true } },
            { $group: { _id: '$category', count: { $sum: 1 } } }
        ]).exec();

        return result.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
        }, {} as Record<string, number>);
    }

    async countActive(): Promise<number> {
        return await this.achievementModel.countDocuments({ isActive: true }).exec();
    }

    private mapToEntity(document: any): AchievementEntity {
        return AchievementEntity.reconstitute({
            id: document._id.toString(),
            code: document.code,
            name: document.name,
            description: document.description,
            category: document.category,
            requirement: document.requirement,
            isActive: document.isActive,
            createdAt: document.createdAt,
            updatedAt: document.updatedAt
        });
    }

    private mapToDocument(achievement: AchievementEntity): Partial<AchievementDocument> {
        return {
            code: achievement.code.toString(),
            name: achievement.name,
            description: achievement.description,
            category: achievement.category,
            requirement: achievement.requirement,
            isActive: achievement.isActive,
            updatedAt: achievement.updatedAt
        };
    }
}

