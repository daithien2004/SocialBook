// src/modules/library/schemas/collection.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type CollectionDocument = HydratedDocument<Collection>;

@Schema({ timestamps: true, collection: 'collections' })
export class Collection {
  // Folder này của ai?
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  // Tên Folder (VD: "Truyện Tiên Hiệp Hay")
  @Prop({ required: true, trim: true })
  name: string;

  // (Optional) Mô tả cho folder
  @Prop({ default: '' })
  description: string;

  // (Optional) Folder công khai hay riêng tư?
  @Prop({ default: false })
  isPublic: boolean;
}

export const CollectionSchema = SchemaFactory.createForClass(Collection);

// Index: 1 User không được tạo 2 folder trùng tên
CollectionSchema.index({ userId: 1, name: 1 }, { unique: true });
