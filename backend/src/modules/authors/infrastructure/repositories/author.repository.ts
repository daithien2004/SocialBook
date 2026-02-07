import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { Author, AuthorDocument } from '../schemas/author.schema';
import { IAuthorRepository, AuthorFilter, PaginationOptions } from '../../domain/repositories/author.repository.interface';
import { Author as AuthorEntity } from '../../domain/entities/author.entity';
import { AuthorId } from '../../domain/value-objects/author-id.vo';
import { AuthorName } from '../../domain/value-objects/author-name.vo';
import { PaginatedResult } from '@/src/common/interfaces/pagination.interface';

@Injectable()
export class AuthorRepository implements IAuthorRepository {
    constructor(@InjectModel(Author.name) private readonly authorModel: Model<AuthorDocument>) {}

    async findById(id: AuthorId): Promise<AuthorEntity | null> {
        const document = await this.authorModel.findById(id.toString()).lean().exec();
        return document ? this.mapToEntity(document) : null;
    }

    async findByName(name: AuthorName): Promise<AuthorEntity | null> {
        const document = await this.authorModel.findOne({ name: name.toString() }).lean().exec();
        return document ? this.mapToEntity(document) : null;
    }

    async findAll(filter: AuthorFilter, pagination: PaginationOptions): Promise<PaginatedResult<AuthorEntity>> {
        const queryFilter: FilterQuery<AuthorDocument> = {};
        
        if (filter.name) {
            queryFilter.name = { $regex: filter.name, $options: 'i' };
        }
        
        if (filter.bio) {
            queryFilter.bio = { $regex: filter.bio, $options: 'i' };
        }

        const skip = (pagination.page - 1) * pagination.limit;
        const total = await this.authorModel.countDocuments(queryFilter).exec();
        const documents = await this.authorModel
            .find(queryFilter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(pagination.limit)
            .lean()
            .exec();

        return {
            data: documents.map(doc => this.mapToEntity(doc)),
            meta: {
                current: pagination.page,
                pageSize: pagination.limit,
                total,
                totalPages: Math.ceil(total / pagination.limit),
            },
        };
    }

    async findAllSimple(): Promise<AuthorEntity[]> {
        const documents = await this.authorModel
            .find()
            .select('name bio photoUrl slug createdAt updatedAt')
            .sort({ name: 1 })
            .lean()
            .exec();
        
        return documents.map(doc => this.mapToEntity(doc));
    }

    async save(author: AuthorEntity): Promise<void> {
        const document = this.mapToDocument(author);
        await this.authorModel.findByIdAndUpdate(
            author.id.toString(),
            document,
            { upsert: true, new: true }
        ).exec();
    }

    async delete(id: AuthorId): Promise<void> {
        await this.authorModel.findByIdAndDelete(id.toString()).exec();
    }

    async existsByName(name: AuthorName, excludeId?: AuthorId): Promise<boolean> {
        const query: FilterQuery<AuthorDocument> = { name: name.toString() };
        if (excludeId) {
            query._id = { $ne: excludeId.toString() };
        }
        
        const count = await this.authorModel.countDocuments(query).exec();
        return count > 0;
    }

    async countActive(): Promise<number> {
        return await this.authorModel.countDocuments().exec();
    }

    private mapToEntity(document: any): AuthorEntity {
        return AuthorEntity.reconstitute({
            id: document._id.toString(),
            name: document.name,
            slug: document.slug || this.generateSlug(document.name),
            bio: document.bio || '',
            photoUrl: document.photoUrl || '',
            createdAt: document.createdAt,
            updatedAt: document.updatedAt,
        });
    }

    private mapToDocument(author: AuthorEntity): Partial<AuthorDocument> {
        return {
            name: author.name.toString(),
            slug: author.slug,
            bio: author.bio,
            photoUrl: author.photoUrl,
            updatedAt: author.updatedAt,
        };
    }

    async searchByName(query: string, limit: number = 10): Promise<AuthorEntity[]> {
        if (!query) return [];
        
        // Normalize for better matching if needed, or simple regex
        const regex = new RegExp(query, 'i');
        
        const documents = await this.authorModel
            .find({ name: { $regex: regex } })
            .limit(limit)
            .lean()
            .exec();
            
        return documents.map(doc => this.mapToEntity(doc));
    }

    private generateSlug(name: string): string {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }
}
