import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import slugify from 'slugify';

export type GenreDocument = Genre & Document;

@Schema({ timestamps: true })
export class Genre {
  @Prop({ required: true, unique: true, index: true })
  name: string;

  @Prop({ unique: true, index: true })
  slug: string;

  @Prop()
  description: string;
}

export const GenreSchema = SchemaFactory.createForClass(Genre);

// Pre-save hook to generate slug from name
GenreSchema.pre('save', function (next) {
  if (this.isModified('name') || !this.slug) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});
