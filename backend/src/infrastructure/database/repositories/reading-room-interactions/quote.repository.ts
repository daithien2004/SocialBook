import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RoomQuote } from '@/domain/reading-room-interactions/entities/room-quote.entity';
import { IQuoteRepository } from '@/domain/reading-room-interactions/repositories/quote.repository.interface';
import {
  RoomQuoteSchema,
  RoomQuoteDocument,
} from '../../schemas/reading-room-interactions/room-quote.schema';

@Injectable()
export class QuoteRepository extends IQuoteRepository {
  constructor(
    @InjectModel(RoomQuoteSchema.name)
    private readonly quoteModel: Model<RoomQuoteDocument>,
  ) {
    super();
  }

  async save(quote: RoomQuote): Promise<void> {
    await this.quoteModel.create({
      _id: quote.id,
      roomId: quote.roomId,
      content: quote.content,
      userId: quote.userId,
      chapterSlug: quote.chapterSlug,
      paragraphId: quote.paragraphId,
      votes: quote.votes,
      createdAt: quote.createdAt,
    });
  }

  async findByRoom(
    roomId: string,
    options?: { limit?: number },
  ): Promise<RoomQuote[]> {
    const docs = await this.quoteModel
      .find({ roomId })
      .sort({ createdAt: -1 })
      .limit(options?.limit || 50)
      .lean()
      .exec();
    return docs.map((d) =>
      RoomQuote.reconstitute({
        id: String(d._id),
        roomId: d.roomId,
        content: d.content,
        userId: d.userId,
        chapterSlug: d.chapterSlug,
        paragraphId: d.paragraphId,
        votes: (d.votes || []).map((v) => ({
          userId: v.userId,
          type: v.type as 'up' | 'down',
        })),
        createdAt: d.createdAt,
      }),
    );
  }

  async findById(id: string): Promise<RoomQuote | null> {
    const doc = await this.quoteModel.findById(id).lean().exec();
    if (!doc) return null;
    return RoomQuote.reconstitute({
      id: String(doc._id),
      roomId: doc.roomId,
      content: doc.content,
      userId: doc.userId,
      chapterSlug: doc.chapterSlug,
      paragraphId: doc.paragraphId,
      votes: (doc.votes || []).map((v) => ({
        userId: v.userId,
        type: v.type as 'up' | 'down',
      })),
      createdAt: doc.createdAt,
    });
  }

  async updateVotes(quote: RoomQuote): Promise<void> {
    await this.quoteModel
      .findByIdAndUpdate(quote.id, { votes: quote.votes })
      .exec();
  }

  async deleteById(id: string): Promise<void> {
    await this.quoteModel.findByIdAndDelete(id).exec();
  }

  async deleteByRoom(roomId: string): Promise<void> {
    await this.quoteModel.deleteMany({ roomId }).exec();
  }
}
