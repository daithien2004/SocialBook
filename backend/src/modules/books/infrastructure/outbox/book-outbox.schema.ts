import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type BookOutboxDocument = HydratedDocument<BookOutboxRecord>;

@Schema({ timestamps: true, collection: 'book_outbox' })
export class BookOutboxRecord {
  @Prop({ required: true, unique: true })
  eventId!: string;

  @Prop({
    required: true,
    enum: ['book.created', 'book.updated', 'book.deleted'],
  })
  type!: string;

  @Prop({ required: true })
  bookId!: string;

  @Prop({
    required: true,
    default: 'pending',
    enum: ['pending', 'processing', 'published'],
  })
  status!: string;

  @Prop({ type: Date, default: null })
  leaseUntil!: Date | null;

  @Prop({ type: Date, default: Date.now })
  availableAt!: Date;

  @Prop({ type: Date, default: null })
  publishedAt!: Date | null;

  @Prop({ default: 0 })
  attempts!: number;
}

export const BookOutboxSchema = SchemaFactory.createForClass(BookOutboxRecord);
BookOutboxSchema.index({ status: 1, availableAt: 1, createdAt: 1 });
BookOutboxSchema.index({ status: 1, leaseUntil: 1, createdAt: 1 });
BookOutboxSchema.index(
  { publishedAt: 1 },
  {
    expireAfterSeconds: 30 * 24 * 60 * 60,
    partialFilterExpression: { status: 'published' },
  },
);
