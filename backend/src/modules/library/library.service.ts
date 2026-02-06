import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import {
  ReadingList,
  ReadingListDocument,
  ReadingStatus,
} from './schemas/reading-list.schema';
import {
  Progress,
  ProgressDocument,
} from '../progress/schemas/progress.schema';
import { LibraryItemModal } from './modals/library-item.modal';
import { AddToCollectionsDto, UpdateProgressDto, UpdateReadingTimeDto } from './dto/library.dto';
import { Chapter, ChapterDocument } from '../chapters/schemas/chapter.schema';
import { GamificationService } from '../gamification/gamification.service';

@Injectable()
export class LibraryService {
  constructor(
    @InjectModel(ReadingList.name)
    private readingListModel: Model<ReadingListDocument>,
    @InjectModel(Chapter.name)
    private chapterModel: Model<ChapterDocument>,
    @InjectModel(Progress.name) private progressModel: Model<ProgressDocument>,
    private gamificationService: GamificationService,
  ) { }

  async getSystemLibrary(userId: string, status: ReadingStatus) {
    return this.readingListModel
      .find({ userId: new Types.ObjectId(userId), status })
      .populate('bookId', 'title coverUrl authorId slug')
      .populate('lastReadChapterId', 'title slug orderIndex')
      .sort({ updatedAt: -1 })
      .lean();
  }

  async updateStatus(userId: string, bookId: string, status: ReadingStatus) {
    if (!Types.ObjectId.isValid(bookId))
      throw new BadRequestException('Invalid Book ID');

    return this.readingListModel
      .findOneAndUpdate(
        {
          userId: new Types.ObjectId(userId),
          bookId: new Types.ObjectId(bookId),
        },
        {
          userId: new Types.ObjectId(userId),
          bookId: new Types.ObjectId(bookId),
          status,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      )
      .lean();
  }

  async updateProgress(userId: string, dto: UpdateProgressDto) {
    const { bookId, chapterId, progress } = dto;

    if (!Types.ObjectId.isValid(bookId) || !Types.ObjectId.isValid(chapterId)) {
      throw new BadRequestException('Invalid ID');
    }

    const userObjectId = new Types.ObjectId(userId);
    const bookObjectId = new Types.ObjectId(bookId);
    const chapterObjectId = new Types.ObjectId(chapterId);

    const progressValue = progress || 0;

    const currentReadingList = await this.readingListModel
      .findOne({ userId: userObjectId, bookId: bookObjectId })
      .select('status')
      .lean();

    const isAlreadyCompleted =
      currentReadingList?.status === ReadingStatus.COMPLETED;

    const lastChapter = await this.chapterModel
      .findOne({ bookId: bookObjectId })
      .sort({ orderIndex: -1 })
      .select('_id');

    const isLastChapter =
      lastChapter && lastChapter._id.toString() === chapterId;

    const chapterStatus =
      progressValue >= 80 ? ReadingStatus.COMPLETED : ReadingStatus.READING;

    let bookStatus = ReadingStatus.READING;

    if (isAlreadyCompleted) {
      bookStatus = ReadingStatus.COMPLETED;
    } else {
      if (isLastChapter && progressValue >= 80) {
        bookStatus = ReadingStatus.COMPLETED;
      } else {
        bookStatus = ReadingStatus.READING;
      }
    }

    const [updatedProgress, updatedReadingList] = await Promise.all([
      this.progressModel
        .findOneAndUpdate(
          { userId: userObjectId, chapterId: chapterObjectId },
          {
            userId: userObjectId,
            bookId: bookObjectId,
            chapterId: chapterObjectId,
            progress: progressValue,
            status: chapterStatus,
            lastReadAt: new Date(),
          },
          { upsert: true, new: true },
        )
        .lean(),

      this.readingListModel
        .findOneAndUpdate(
          { userId: userObjectId, bookId: bookObjectId },
          {
            status: bookStatus,
            lastReadChapterId: chapterObjectId,
          },
          { upsert: true, new: true },
        )
        .lean(),
    ]);

    return updatedReadingList;
  }

  async recordReadingTime(userId: string, dto: UpdateReadingTimeDto) {
    const { bookId, chapterId, durationInSeconds } = dto;
    const userObjectId = new Types.ObjectId(userId);
    const chapterObjectId = new Types.ObjectId(chapterId);

    await this.progressModel.findOneAndUpdate(
      { userId: userObjectId, chapterId: chapterObjectId },
      {
        $inc: { timeSpent: durationInSeconds }
      },
      { upsert: true, new: true }
    );

    const minutes = Math.ceil(durationInSeconds / 60);

    if (minutes > 0) {
      await this.gamificationService.updateDailyProgress(userId, durationInSeconds / 60);
    }

    return { success: true };
  }

  async updateBookCollections(userId: string, dto: AddToCollectionsDto) {
    const { bookId, collectionIds } = dto;

    if (!Types.ObjectId.isValid(bookId))
      throw new BadRequestException('Invalid Book ID');
    if (collectionIds.some((id) => !Types.ObjectId.isValid(id))) {
      throw new BadRequestException('Invalid Collection ID');
    }

    return this.readingListModel
      .findOneAndUpdate(
        {
          userId: new Types.ObjectId(userId),
          bookId: new Types.ObjectId(bookId),
        },
        {
          $set: {
            collectionIds: collectionIds.map((id) => new Types.ObjectId(id)),
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      )
      .lean();
  }

  async getChapterProgress(userId: string, bookId: string, chapterId: string) {
    if (!bookId || !chapterId) return { progress: 0 };
    if (!Types.ObjectId.isValid(bookId) || !Types.ObjectId.isValid(chapterId))
      return { progress: 0 };

    const progress = await this.progressModel
      .findOne({
        userId: new Types.ObjectId(userId),
        chapterId: new Types.ObjectId(chapterId),
        bookId: new Types.ObjectId(bookId),
      })
      .select('progress')
      .lean();

    return {
      progress: progress?.progress || 0,
    };
  }

  async removeFromLibrary(userId: string, bookId: string) {
    if (!Types.ObjectId.isValid(bookId))
      throw new BadRequestException('Invalid Book ID');

    await this.readingListModel.deleteOne({
      userId: new Types.ObjectId(userId),
      bookId: new Types.ObjectId(bookId),
    });

    return { success: true };
  }

  async getBookLibraryInfo(userId: string, bookId: string) {
    if (!Types.ObjectId.isValid(bookId))
      throw new BadRequestException('Invalid Book ID');

    const readingListEntry = await this.readingListModel
      .findOne({
        userId: new Types.ObjectId(userId),
        bookId: new Types.ObjectId(bookId),
      })
      .populate('collectionIds', 'name')
      .lean();

    if (!readingListEntry) {
      return {
        status: null,
        collections: [],
      };
    }

    return {
      status: readingListEntry.status,
      collections: readingListEntry.collectionIds,
    };
  }
}
