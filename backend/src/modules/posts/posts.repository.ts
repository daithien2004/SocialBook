import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { GenericRepository } from '../../shared/repository/generic.repository';
import { Post, PostDocument } from './schemas/post.schema';

@Injectable()
export class PostsRepository extends GenericRepository<PostDocument> {
    constructor(@InjectModel(Post.name) postModel: Model<PostDocument>) {
        super(postModel);
    }

    async findAllWithPopulate(skip: number, limit: number, filter: FilterQuery<PostDocument> = { isDelete: false, isFlagged: false }) {
        return this.model
            .find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('userId', 'username email image')
            .populate({
                path: 'bookId',
                select: 'title coverUrl',
                populate: {
                    path: 'authorId',
                    select: 'name bio',
                },
            })
            .lean()
            .exec() as Promise<PostDocument[]>;
    }

    async findByIdWithPopulate(id: string | Types.ObjectId) {
        return this.model
            .findOne({ _id: id, isDelete: false, isFlagged: false })
            .populate('userId', 'username email image')
            .populate({
                path: 'bookId',
                select: 'title coverUrl',
                populate: {
                    path: 'authorId',
                    select: 'name bio',
                },
            })
            .lean()
            .exec() as Promise<PostDocument | null>;
    }

    async createPost(data: Partial<PostDocument>) {
        const newPost = await this.create(data);
        return this.model
            .findById(newPost._id)
            .populate('userId', 'name email image')
            .populate('bookId', 'title coverUrl')
            .lean()
            .exec() as Promise<PostDocument | null>;
    }

    async findOneForUpdate(id: string | Types.ObjectId) {
        return this.model.findOne({ _id: id, isDelete: false }); // Returns document for .save()
    }

    async updateWithPopulate(post: PostDocument) {
        // Needs document to save()
        const updatedPost = await post.save();
        return this.model
            .findById(updatedPost._id)
            .populate('userId', 'name email image')
            .populate('bookId', 'title coverUrl')
            .lean()
            .exec() as Promise<PostDocument | null>;
    }

    async softDelete(id: string | Types.ObjectId, errorMsg = 'Not found'): Promise<void> {
        const result = await this.model.findOneAndUpdate(
            { _id: id, isDelete: false },
            { isDelete: true, updatedAt: new Date() },
            { new: true },
        ).exec();
        if (!result) throw new Error(errorMsg);
    }

    async findByIdSelected(id: string | Types.ObjectId, select: string) {
        return this.model.findById(id).select(select).lean().exec();
    }

    async getFlaggedPosts(skip: number, limit: number) {
        return this.model
            .find({ isFlagged: true, isDelete: false })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('userId', 'username email image')
            .populate('bookId', 'title coverUrl')
            .lean()
            .exec() as Promise<PostDocument[]>;
    }

    async countByUser(userId: string | Types.ObjectId): Promise<number> {
        return this.model.countDocuments({ userId, isDelete: false }).exec();
    }
}
