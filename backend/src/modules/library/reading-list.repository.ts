import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { GenericRepository } from '../../shared/repository/generic.repository';
import { ReadingList, ReadingListDocument } from './schemas/reading-list.schema';

@Injectable()
export class ReadingListRepository extends GenericRepository<ReadingListDocument> {
    constructor(
        @InjectModel(ReadingList.name) readingListModel: Model<ReadingListDocument>
    ) {
        super(readingListModel);
    }

    async countByUser(userId: string | Types.ObjectId): Promise<number> {
        return this.model.countDocuments({ userId }).exec();
    }
}
