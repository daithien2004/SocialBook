import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ReviewDocument = HydratedDocument<Review>;

@Schema({ timestamps: true })
export class Review {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Book', required: true })
  bookId: Types.ObjectId;

  @Prop({ type: String, required: true, trim: true })
  content: string;

  @Prop({
    type: Number,
    min: 1,
    max: 5,
    required: true
  })
  rating: number;

  @Prop({ type: Number, default: 0 })
  likesCount: number;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  likedBy: Types.ObjectId[];

  @Prop({ type: Boolean, default: false })
  verifiedPurchase: boolean;

  @Prop({ type: Boolean, default: false })
  isFlagged: boolean;

  @Prop({ type: String })
  moderationReason?: string;

  @Prop({ type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' })
  moderationStatus?: string;
}

export const ReviewSchema = SchemaFactory.createForClass(Review);

ReviewSchema.virtual('id').get(function () {
  return this._id.toString();
});

// Index để đảm bảo mỗi user chỉ review 1 lần cho 1 book
ReviewSchema.index({ userId: 1, bookId: 1 }, { unique: true });