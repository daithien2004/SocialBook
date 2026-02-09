import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { INotificationRepository } from '@/domain/notifications/repositories/notification.repository.interface';
import { Notification } from '@/domain/notifications/entities/notification.entity';
import { NotificationDocument, Notification as NotificationSchemaClass } from '../../schemas/notification.schema';

@Injectable()
export class NotificationRepository implements INotificationRepository {
  constructor(
    @InjectModel(NotificationSchemaClass.name)
    private readonly notificationModel: Model<NotificationDocument>,
  ) {}

  async save(notification: Notification): Promise<Notification> {
    const persistenceModel = this.mapToPersistence(notification);
    const idString = notification.id.toString();
    if (idString && Types.ObjectId.isValid(idString)) {
      await this.notificationModel.findByIdAndUpdate(
        idString,
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

  private mapToDomain(doc: NotificationDocument | Record<string, unknown>): Notification {
    const docTyped = doc as Record<string, unknown>;
    return Notification.reconstitute({
      id: String(docTyped._id),
      userId: String(docTyped.userId),
      title: docTyped.title as string,
      message: docTyped.message as string,
      type: docTyped.type as string,
      isRead: docTyped.isRead as boolean,
      sentAt: docTyped.sentAt as Date,
      actionUrl: docTyped.actionUrl as string | undefined,
      meta: docTyped.meta as Record<string, unknown> | undefined,
      createdAt: docTyped.createdAt as Date,
      updatedAt: docTyped.updatedAt as Date,
    });
  }

  private mapToPersistence(entity: Notification): Record<string, unknown> {
    const idString = entity.id.toString();
    return {
      _id: idString && Types.ObjectId.isValid(idString) ? new Types.ObjectId(idString) : undefined,
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


