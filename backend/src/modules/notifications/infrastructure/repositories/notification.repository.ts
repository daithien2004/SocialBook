import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { INotificationRepository } from '../../domain/repositories/notification.repository.interface';
import { Notification } from '../../domain/entities/notification.entity';
import { NotificationDocument, Notification as NotificationSchemaClass } from '../../schemas/notification.schema';

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
    return new Notification(
      doc._id.toString(),
      doc.userId.toString(),
      doc.title,
      doc.message,
      doc.type,
      doc.isRead,
      doc.sentAt,
      doc.actionUrl,
      doc.meta,
      doc.createdAt,
      doc.updatedAt,
    );
  }

  private mapToPersistence(entity: Notification): any {
    return {
      _id: entity.id && Types.ObjectId.isValid(entity.id) ? new Types.ObjectId(entity.id) : undefined,
      userId: new Types.ObjectId(entity.userId),
      title: entity.title,
      message: entity.message,
      type: entity.type,
      isRead: entity.isRead,
      sentAt: entity.sentAt,
      actionUrl: entity.actionUrl,
      meta: entity.meta,
    };
  }
}
