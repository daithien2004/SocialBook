import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import slugify from 'slugify';

import { BaseSchema } from '@/shared/schemas/base.schema';

export type AuthorDocument = Author & Document;

@Schema({ timestamps: true })
export class Author extends BaseSchema {
  @Prop({ required: true, unique: true, index: true })
  name: string;

  @Prop({ unique: true, index: true })
  slug: string;

  @Prop()
  bio: string;

  @Prop()
  photoUrl: string;
}

export const AuthorSchema = SchemaFactory.createForClass(Author);

// Pre-save hook to generate slug from name
AuthorSchema.pre('save', function(next) {
  if (this.isModified('name') || this.isNew) {
    this.slug = slugify(this.name, {
      lower: true,
      strict: true,
      locale: 'vi'
    });
  }
  next();
});
