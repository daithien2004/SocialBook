import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { RoomReaction } from '@/domain/reading-room-interactions/entities/room-reaction.entity';
import type { ReactionTypeValue } from '@/domain/reading-room-interactions/value-objects/reaction-type.vo';
import {
  IReactionRepository,
  ReactionSummary,
} from '@/domain/reading-room-interactions/repositories/reaction.repository.interface';
import {
  RoomReactionSchema,
  RoomReactionDocument,
} from '../../schemas/reading-room-interactions/room-reaction.schema';

interface ReactionAggregationRow {
  paragraphId: string;
  reactions: Record<string, number>;
  userReactions: Record<string, string>;
}

@Injectable()
export class ReactionRepository extends IReactionRepository {
  constructor(
    @InjectModel(RoomReactionSchema.name)
    private readonly reactionModel: Model<RoomReactionDocument>,
  ) {
    super();
  }

  async save(reaction: RoomReaction): Promise<void> {
    await this.reactionModel.create({
      _id: reaction.id,
      roomId: reaction.roomId,
      chapterSlug: reaction.chapterSlug,
      paragraphId: reaction.paragraphId,
      userId: reaction.userId,
      reactionType: reaction.reactionType,
      createdAt: reaction.createdAt,
    });
  }

  async delete(id: string): Promise<void> {
    await this.reactionModel.findByIdAndDelete(id).exec();
  }

  async findByParagraph(
    roomId: string,
    chapterSlug: string,
    paragraphId: string,
    options?: { limit?: number },
  ): Promise<RoomReaction[]> {
    const docs = await this.reactionModel
      .find({ roomId, chapterSlug, paragraphId })
      .limit(options?.limit || 50)
      .lean()
      .exec();
    return docs.map((d) =>
      RoomReaction.reconstitute({
        id: String(d._id),
        roomId: d.roomId,
        chapterSlug: d.chapterSlug,
        paragraphId: d.paragraphId,
        userId: d.userId,
        reactionType: d.reactionType as ReactionTypeValue,
        createdAt: d.createdAt,
      }),
    );
  }

  async findByRoom(
    roomId: string,
    chapterSlug?: string,
    options?: { limit?: number },
  ): Promise<RoomReaction[]> {
    const query: FilterQuery<RoomReactionDocument> = { roomId };
    if (chapterSlug) {
      query.chapterSlug = chapterSlug;
    }
    const docs = await this.reactionModel
      .find(query)
      .limit(options?.limit || 50)
      .lean()
      .exec();
    return docs.map((d) =>
      RoomReaction.reconstitute({
        id: String(d._id),
        roomId: d.roomId,
        chapterSlug: d.chapterSlug,
        paragraphId: d.paragraphId,
        userId: d.userId,
        reactionType: d.reactionType as ReactionTypeValue,
        createdAt: d.createdAt,
      }),
    );
  }

  async findUserReaction(
    roomId: string,
    paragraphId: string,
    userId: string,
    type: string,
  ): Promise<RoomReaction | null> {
    const doc = await this.reactionModel
      .findOne({ roomId, paragraphId, userId, reactionType: type })
      .lean()
      .exec();
    if (!doc) return null;
    return RoomReaction.reconstitute({
      id: String(doc._id),
      roomId: doc.roomId,
      chapterSlug: doc.chapterSlug,
      paragraphId: doc.paragraphId,
      userId: doc.userId,
      reactionType: doc.reactionType as ReactionTypeValue,
      createdAt: doc.createdAt,
    });
  }

  async getSummary(
    roomId: string,
    chapterSlug: string,
    paragraphIds: string[],
  ): Promise<ReactionSummary[]> {
    const docs = await this.reactionModel
      .aggregate<ReactionAggregationRow>([
        { $match: { roomId, chapterSlug, paragraphId: { $in: paragraphIds } } },
        {
          $group: {
            _id: '$paragraphId',
            reactions: { $push: '$reactionType' },
            userReactions: {
              $push: { type: '$reactionType', userId: '$userId' },
            },
          },
        },
        {
          $project: {
            paragraphId: '$_id',
            reactions: {
              $arrayToObject: {
                $map: {
                  input: { $setUnion: ['$reactions', []] },
                  as: 'r',
                  in: {
                    k: '$$r',
                    v: {
                      $size: {
                        $filter: {
                          input: '$reactions',
                          as: 'f',
                          cond: { $eq: ['$$f', '$$r'] },
                        },
                      },
                    },
                  },
                },
              },
            },
            userReactions: 1,
          },
        },
      ])
      .exec();

    return docs.map(
      (d): ReactionSummary => ({
        paragraphId: d.paragraphId || '',
        reactions: d.reactions || {},
        userReactions: d.userReactions || {},
      }),
    );
  }

  async deleteByRoom(roomId: string): Promise<void> {
    await this.reactionModel.deleteMany({ roomId }).exec();
  }
}
