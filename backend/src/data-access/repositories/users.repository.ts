import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { User, UserDocument } from '../../modules/users/schemas/user.schema';
import { GenericRepository } from '../../shared/repository/generic.repository';

@Injectable()
export class UsersRepository extends GenericRepository<UserDocument> {
    constructor(@InjectModel(User.name) userModel: Model<UserDocument>) {
        super(userModel);
    }

    async existsByEmail(email: string): Promise<boolean> {
        const result = await this.model.exists({ email });
        return !!result;
    }

    async existsById(id: string | Types.ObjectId): Promise<boolean> {
        const result = await this.model.exists({ _id: id });
        return !!result;
    }

    async existsByUsername(username: string, excludeId?: string | Types.ObjectId): Promise<boolean> {
        const query: FilterQuery<UserDocument> = { username };
        if (excludeId) {
            query._id = { $ne: excludeId };
        }
        const result = await this.model.exists(query);
        return !!result;
    }

    async findForRefreshToken(id: string | Types.ObjectId) {
        return this.model.findById(id).select('+hashedRt').lean().exec();
    }

    async findProfile(id: string | Types.ObjectId) {
        return this.model
            .findById(id)
            .select('username image createdAt bio location website')
            .lean()
            .exec();
    }

    async getSearchUsers(filter: FilterQuery<UserDocument>, skip: number, limit: number) {
        return this.model
            .find(filter)
            .select('username image createdAt bio')
            .sort({ username: 1 })
            .skip(skip)
            .limit(limit)
            .lean()
            .exec();
    }

    async findAllWithSelect(
        filter: FilterQuery<UserDocument>,
        sort: string | any,
        skip: number,
        limit: number,
        select: string,
    ) {
        return this.model
            .find(filter)
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .select(select)
            .lean()
            .exec();
    }

    async findByIdWithRole(id: string | Types.ObjectId) {
        return this.model
            .findById(id)
            .populate('roleId')
            .select('-password')
            .lean()
            .exec();
    }

    async findReadingPreferences(id: string | Types.ObjectId) {
        return this.model.findById(id).select('readingPreferences').lean().exec();
    }

    async findByIdSelected(id: string | Types.ObjectId, select: string) {
        return this.model.findById(id).select(select).lean().exec();
    }
    async findByIds(ids: Types.ObjectId[], select: string) {
        return this.model
            .find({ _id: { $in: ids } })
            .select(select)
            .lean()
            .exec();
    }
}
