// notifications/notifications.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Notification } from './schemas/notification.schema';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { Server } from 'socket.io';
import { NotificationModal } from './modals/notification.modal';

@Injectable()
export class NotificationsService {
  private server: Server | null = null;
  setServer(server: Server) { this.server = server; }

  constructor(
    @InjectModel(Notification.name)
    private readonly notifModel: Model<Notification>,
  ) { }

  private userRoom(userId: string) {
    return `user:${userId}`;
  }

  async create(dto: CreateNotificationDto) {
    const doc = await this.notifModel.create({
      userId: new Types.ObjectId(dto.userId),
      title: dto.title,
      message: dto.message,
      type: dto.type,
      isRead: false,
      sentAt: new Date(),
      actionUrl: dto.actionUrl,
      meta: dto.meta
    });

    const modal = new NotificationModal(doc);

    if (this.server) {
      this.server
        .to(this.userRoom(dto.userId))
        .emit('notification:new', modal);
    }

    return modal;
  }

  async findAllByUser(userId: string, limit = 50) {
    const rows = await this.notifModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()
      .exec();
    return NotificationModal.fromArray(rows);
  }

  async markRead(userId: string, id: string) {
    await this.notifModel.updateOne(
      { _id: new Types.ObjectId(id), userId: new Types.ObjectId(userId) },
      { $set: { isRead: true } },
    );
    if (this.server) {
      this.server.to(this.userRoom(userId)).emit('notification:read', { id });
    }
    return { ok: true };
  }
}
