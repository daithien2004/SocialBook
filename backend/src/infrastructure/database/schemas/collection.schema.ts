import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

import { BaseSchema } from '@/shared/schemas/base.schema';

export type CollectionDocument = HydratedDocument<Collection>;

@Schema({ timestamps: true, collection: 'collections' })
export class Collection extends BaseSchema {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ default: '' })
  description: string;

  @Prop({ default: false })
  isPublic: boolean;
}

export const CollectionSchema = SchemaFactory.createForClass(Collection);

CollectionSchema.index({ userId: 1, name: 1 }, { unique: true });
