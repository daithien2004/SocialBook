import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { Collection, CollectionDocument } from './schemas/collection.schema';
import {
  ReadingList,
  ReadingListDocument,
} from './schemas/reading-list.schema';
import { LibraryItemModal } from './modals/library-item.modal';

import { CreateCollectionDto, UpdateCollectionDto } from './dto/collection.dto';
import { ErrorMessages } from '@/src/common/constants/error-messages';

@Injectable()
export class CollectionsService {
  constructor(
    @InjectModel(Collection.name)
    private collectionModel: Model<CollectionDocument>,
    @InjectModel(ReadingList.name)
    private readingListModel: Model<ReadingListDocument>,
  ) { }

  async create(userId: string, dto: CreateCollectionDto) {
    const newCollection = await this.collectionModel.create({
      ...dto,
      userId: new Types.ObjectId(userId),
    });
    return newCollection.toObject();
  }

  async findAll(userId: string) {
    if (!userId || !Types.ObjectId.isValid(userId)) {
      throw new BadRequestException(ErrorMessages.INVALID_ID);
    }

    const collections = await this.collectionModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .lean();

    return collections;
  }

  async findOneWithBooks(userId: string, collectionId: string) {
    if (!Types.ObjectId.isValid(collectionId)) {
      throw new BadRequestException(ErrorMessages.INVALID_ID);
    }

    if (!userId || !Types.ObjectId.isValid(userId)) {
      throw new BadRequestException(ErrorMessages.INVALID_ID);
    }

    const userObjectId = new Types.ObjectId(userId);
    const collectionObjectId = new Types.ObjectId(collectionId);

    const [collection, books] = await Promise.all([
      this.collectionModel
        .findOne({ _id: collectionObjectId, userId: userObjectId })
        .lean(),

      this.readingListModel
        .find({
          userId: userObjectId,
          collectionIds: collectionObjectId,
        })
        .populate({
          path: 'bookId',
          select: 'title coverUrl authorId slug status',
          populate: {
            path: 'authorId',
            select: 'name',
          },
        })
        .populate('lastReadChapterId', 'title slug orderIndex')
        .sort({ updatedAt: -1 })
        .lean(),
    ]);

    if (!collection) {
      throw new NotFoundException(ErrorMessages.COLLECTION_NOT_FOUND);
    }

    return {
      folder: collection,
      books: LibraryItemModal.fromArray(books as any),
    };
  }

  async update(userId: string, collectionId: string, dto: UpdateCollectionDto) {
    if (!Types.ObjectId.isValid(collectionId)) {
      throw new BadRequestException(ErrorMessages.INVALID_ID);
    }

    const updated = await this.collectionModel
      .findOneAndUpdate(
        { _id: collectionId, userId: new Types.ObjectId(userId) },
        dto,
        { new: true },
      )
      .lean();

    if (!updated) throw new NotFoundException(ErrorMessages.COLLECTION_NOT_FOUND);
    return updated;
  }

  async remove(userId: string, collectionId: string) {
    if (!Types.ObjectId.isValid(collectionId)) {
      throw new BadRequestException(ErrorMessages.INVALID_ID);
    }

    const collectionObjectId = new Types.ObjectId(collectionId);
    const userObjectId = new Types.ObjectId(userId);

    const deleted = await this.collectionModel.findOneAndDelete({
      _id: collectionObjectId,
      userId: userObjectId,
    });

    if (!deleted) throw new NotFoundException(ErrorMessages.COLLECTION_NOT_FOUND);

    await this.readingListModel.updateMany(
      { userId: userObjectId, collectionIds: collectionObjectId },
      { $pull: { collectionIds: collectionObjectId } },
    );

    return { success: true };
  }
}
