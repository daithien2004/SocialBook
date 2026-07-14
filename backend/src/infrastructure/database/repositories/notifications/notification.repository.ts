import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { INotificationRepository } from '@/domain/notifications/repositories/notification.repository.interface';
import { Notification } from '@/domain/notifications/entities/notification.entity';
import {
  NotificationDocument,
  Notification as NotificationSchemaClass,
} from '../../schemas/notification.schema';
import { NotificationMapper } from './notification.mapper';

@Injectable()
export class NotificationRepository implements INotificationRepository {
  constructor(
    @InjectModel(NotificationSchemaClass.name)
    private readonly notificationModel: Model<NotificationDocument>,
  ) {}

  async save(notification: Notification): Promise<Notification> {
    const persistenceModel = this.mapToPersistence(notification);
    if (notification.id && Types.ObjectId.isValid(notification.id)) {
      await this.notificationModel
        .findByIdAndUpdate(notification.id, persistenceModel, {
          upsert: true,
          new: true,
        })
        .exec();
      return notification;
    } else {
      const created = await this.notificationModel.create(persistenceModel);
      return this.mapToDomain(created);
    }
  }

  async findById(id: string): Promise<Notification | null> {
    const doc = await this.notificationModel.findById(id).lean().exec();
    return doc ? this.mapToDomain(doc) : null;
  }

  async findAllByUser(
    userId: string,
    limit = 50,
    offset = 0,
    isRead?: boolean,
  ): Promise<Notification[]> {
    const query: FilterQuery<NotificationDocument> = {
      userId: new Types.ObjectId(userId),
    };
    if (isRead !== undefined) {
      query.isRead = isRead;
    }
    const docs = await this.notificationModel
      .find(query)
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .lean()
      .exec();
    return docs.map((doc) => this.mapToDomain(doc));
  }

  async markAsRead(userId: string, notificationId: string): Promise<void> {
    await this.notificationModel
      .updateOne(
        {
          _id: new Types.ObjectId(notificationId),
          userId: new Types.ObjectId(userId),
        },
        { $set: { isRead: true } },
      )
      .exec();
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationModel
      .updateMany(
        {
          userId: new Types.ObjectId(userId),
          isRead: false,
        },
        { $set: { isRead: true } },
      )
      .exec();
  }

  async countUnread(userId: string): Promise<number> {
    return this.notificationModel
      .countDocuments({
        userId: new Types.ObjectId(userId),
        isRead: false,
      })
      .exec();
  }

  private mapToDomain(doc: NotificationDocument): Notification {
    return NotificationMapper.toDomain(doc);
  }

  private mapToPersistence(
    entity: Notification,
  ): ReturnType<typeof NotificationMapper.toPersistence> {
    return NotificationMapper.toPersistence(entity);
  }
}
