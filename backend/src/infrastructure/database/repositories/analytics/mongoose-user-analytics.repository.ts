import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { IUserAnalyticsRepository } from '@/domain/analytics/repositories/user-analytics.repository.interface';
import { UserEvent as UserEventEntity } from '@/domain/analytics/entities/user-event.entity';
import { UserPreference as UserPreferenceEntity } from '@/domain/analytics/entities/user-preference.entity';
import { UserEvent, UserEventDocument } from '../../schemas/user-event.schema';
import { UserPreference, UserPreferenceDocument } from '../../schemas/user-preference.schema';
import { UserEventMapper } from './user-event.mapper';
import { UserPreferenceMapper } from './user-preference.mapper';

@Injectable()
export class MongooseUserAnalyticsRepository implements IUserAnalyticsRepository {
  constructor(
    @InjectModel(UserEvent.name)
    private readonly eventModel: Model<UserEventDocument>,
    @InjectModel(UserPreference.name)
    private readonly preferenceModel: Model<UserPreferenceDocument>,
  ) {}

  async saveEvent(event: UserEventEntity): Promise<void> {
    const persistence = UserEventMapper.toPersistence(event);
    await this.eventModel.updateOne(
      { _id: persistence._id },
      { $set: persistence },
      { upsert: true },
    );
  }

  async updatePreferenceScore(
    userId: string,
    genreId: string,
    delta: number,
  ): Promise<void> {
    await this.preferenceModel.updateOne(
      {
        userId: new Types.ObjectId(userId),
        genreId: new Types.ObjectId(genreId),
      },
      {
        $inc: { score: delta },
        $setOnInsert: { createdAt: new Date() },
        $set: { updatedAt: new Date() },
      },
      { upsert: true },
    );
  }

  async getTopGenresForUser(
    userId: string,
    limit = 5,
  ): Promise<UserPreferenceEntity[]> {
    const documents = await this.preferenceModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ score: -1 })
      .limit(limit)
      .lean()
      .exec();

    return documents.map((doc) => UserPreferenceMapper.toDomain(doc));
  }

  async findPreference(
    userId: string,
    genreId: string,
  ): Promise<UserPreferenceEntity | null> {
    const document = await this.preferenceModel
      .findOne({
        userId: new Types.ObjectId(userId),
        genreId: new Types.ObjectId(genreId),
      })
      .lean()
      .exec();

    return document ? UserPreferenceMapper.toDomain(document) : null;
  }
}
