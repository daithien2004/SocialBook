import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MongoSessionContext } from '@/shared/infrastructure/mongo-session.context';
import {
  UserRoleChangeOutboxEvent,
  UserRoleChangeOutboxPort,
} from '@/modules/users/application/users/user-role-change-outbox.port';
import {
  UserRoleChangeOutboxDocument,
  UserRoleChangeOutboxRecord,
} from './user-role-change-outbox.schema';

@Injectable()
export class UserRoleChangeOutboxRepository implements UserRoleChangeOutboxPort {
  constructor(
    @InjectModel(UserRoleChangeOutboxRecord.name)
    private readonly model: Model<UserRoleChangeOutboxDocument>,
    private readonly sessionContext: MongoSessionContext,
  ) {}

  async append(
    event: Omit<UserRoleChangeOutboxEvent, 'attempts'>,
  ): Promise<void> {
    await this.model.create(
      [
        {
          eventId: event.id,
          userId: event.userId,
          roleId: event.roleId,
          status: 'pending',
          leaseUntil: null,
          availableAt: new Date(),
          publishedAt: null,
          attempts: 0,
        },
      ],
      { session: this.sessionContext.currentSession },
    );
  }

  async claimBatch(limit: number): Promise<UserRoleChangeOutboxEvent[]> {
    const events: UserRoleChangeOutboxEvent[] = [];
    const now = new Date();
    const leaseUntil = new Date(now.getTime() + 60_000);
    for (let index = 0; index < limit; index += 1) {
      const record = await this.model
        .findOneAndUpdate(
          {
            $or: [
              {
                status: 'pending',
                $or: [
                  { availableAt: { $lte: now } },
                  { availableAt: { $exists: false } },
                ],
              },
              { status: 'processing', leaseUntil: { $lte: now } },
            ],
          },
          { $set: { status: 'processing', leaseUntil }, $inc: { attempts: 1 } },
          { new: true, sort: { createdAt: 1 } },
        )
        .lean()
        .exec();
      if (!record) break;
      events.push({
        id: record.eventId,
        userId: record.userId,
        roleId: record.roleId,
        attempts: record.attempts,
      });
    }
    return events;
  }

  async markPublished(eventId: string): Promise<void> {
    await this.model
      .updateOne(
        { eventId, status: 'processing' },
        {
          $set: {
            status: 'published',
            publishedAt: new Date(),
            leaseUntil: null,
          },
        },
      )
      .exec();
  }

  async release(eventId: string, retryDelayMs: number): Promise<void> {
    await this.model
      .updateOne(
        { eventId, status: 'processing' },
        {
          $set: {
            status: 'pending',
            leaseUntil: null,
            availableAt: new Date(Date.now() + retryDelayMs),
          },
        },
      )
      .exec();
  }
}
