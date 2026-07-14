import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { RoomComment } from '@/domain/reading-room-interactions/entities/room-comment.entity';
import { ICommentRepository } from '@/domain/reading-room-interactions/repositories/comment.repository.interface';
import {
  RoomCommentSchema,
  RoomCommentDocument,
} from '../../schemas/reading-room-interactions/room-comment.schema';

@Injectable()
export class CommentRepository extends ICommentRepository {
  constructor(
    @InjectModel(RoomCommentSchema.name)
    private readonly commentModel: Model<RoomCommentDocument>,
  ) {
    super();
  }

  async save(comment: RoomComment): Promise<void> {
    await this.commentModel
      .findByIdAndUpdate(
        comment.id,
        {
          _id: comment.id,
          roomId: comment.roomId,
          chapterSlug: comment.chapterSlug,
          paragraphId: comment.paragraphId,
          content: comment.content,
          userId: comment.userId,
          parentCommentId: comment.parentCommentId,
          createdAt: comment.createdAt,
          updatedAt: comment.updatedAt,
        },
        { upsert: true, new: true },
      )
      .exec();
  }

  async findById(id: string): Promise<RoomComment | null> {
    const doc = await this.commentModel.findById(id).lean().exec();
    if (!doc) return null;
    return RoomComment.reconstitute({
      id: String(doc._id),
      roomId: doc.roomId,
      chapterSlug: doc.chapterSlug,
      paragraphId: doc.paragraphId,
      content: doc.content,
      userId: doc.userId,
      parentCommentId: doc.parentCommentId,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }

  async findByParagraph(
    roomId: string,
    chapterSlug: string,
    paragraphId: string,
    options?: { limit?: number; before?: Date },
  ): Promise<RoomComment[]> {
    const query: FilterQuery<RoomCommentDocument> = {
      roomId,
      chapterSlug,
      paragraphId,
    };
    if (options?.before) {
      query.createdAt = { $lt: options.before };
    }
    const docs = await this.commentModel
      .find(query)
      .sort({ createdAt: 1 })
      .limit(options?.limit || 50)
      .lean()
      .exec();
    return docs.map((d) =>
      RoomComment.reconstitute({
        id: String(d._id),
        roomId: d.roomId,
        chapterSlug: d.chapterSlug,
        paragraphId: d.paragraphId,
        content: d.content,
        userId: d.userId,
        parentCommentId: d.parentCommentId,
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
      }),
    );
  }

  async findByRoom(
    roomId: string,
    chapterSlug?: string,
    options?: { limit?: number; before?: Date },
  ): Promise<RoomComment[]> {
    const query: FilterQuery<RoomCommentDocument> = { roomId };
    if (chapterSlug) {
      query.chapterSlug = chapterSlug;
    }
    if (options?.before) {
      query.createdAt = { $lt: options.before };
    }
    const docs = await this.commentModel
      .find(query)
      .sort({ createdAt: 1 })
      .limit(options?.limit || 50)
      .lean()
      .exec();
    return docs.map((d) =>
      RoomComment.reconstitute({
        id: String(d._id),
        roomId: d.roomId,
        chapterSlug: d.chapterSlug,
        paragraphId: d.paragraphId,
        content: d.content,
        userId: d.userId,
        parentCommentId: d.parentCommentId,
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
      }),
    );
  }

  async delete(id: string): Promise<void> {
    await this.commentModel.findByIdAndDelete(id).exec();
  }

  async deleteByRoom(roomId: string): Promise<void> {
    await this.commentModel.deleteMany({ roomId }).exec();
  }
}
