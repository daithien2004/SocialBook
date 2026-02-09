import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { INotificationRepository } from '@/domain/notifications/repositories/notification.repository.interface';
import { Notification } from '@/domain/notifications/entities/notification.entity';
import { NotificationDocument, Notification as NotificationSchemaClass } from '../../schemas/notification.schema';
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
        await this.notificationModel.findByIdAndUpdate(
            notification.id,
            persistenceModel,
            { upsert: true, new: true }
        ).exec();
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

  async findAllByUser(userId: string, limit = 50, offset = 0): Promise<Notification[]> {
    const docs = await this.notificationModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .lean()
      .exec();
    return docs.map((doc) => this.mapToDomain(doc));
  }

  async markAsRead(userId: string, notificationId: string): Promise<void> {
    await this.notificationModel.updateOne(
      { _id: new Types.ObjectId(notificationId), userId: new Types.ObjectId(userId) },
      { $set: { isRead: true } },
    ).exec();
  }

  async countUnread(userId: string): Promise<number> {
    return this.notificationModel.countDocuments({
      userId: new Types.ObjectId(userId),
      isRead: false,
    }).exec();
  }

  private mapToDomain(doc: any): Notification {
    return NotificationMapper.toDomain(doc);
  }

  private mapToPersistence(entity: Notification): any {
    return NotificationMapper.toPersistence(entity);
  }
}

