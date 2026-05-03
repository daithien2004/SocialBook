import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ChapterKnowledgeDocument = ChapterKnowledge & Document;

@Schema({ _id: false })
export class KnowledgeEntitySchema {
  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String, enum: ['character', 'location', 'concept', 'event', 'vocabulary', 'reference'], required: true })
  type: string;

  @Prop({ type: String, required: true })
  description: string;

  @Prop({ type: Number, default: 5 })
  importance: number;
}

@Schema({ _id: false })
export class KnowledgeRelationshipSchema {
  @Prop({ type: String, required: true })
  source: string;

  @Prop({ type: String, required: true })
  target: string;

  @Prop({ type: String, required: true })
  type: string;

  @Prop({ type: String })
  description?: string;
}


@Schema({ timestamps: true, collection: 'chapter_knowledge' })
export class ChapterKnowledge {
  @Prop({ type: String, required: true })
  _id: string;

  @Prop({ type: String, required: true, index: true })
  chapterId: string;

  @Prop({ type: [SchemaFactory.createForClass(KnowledgeEntitySchema)], default: [] })
  entities: KnowledgeEntitySchema[];

  @Prop({ type: [SchemaFactory.createForClass(KnowledgeRelationshipSchema)], default: [] })
  relationships: KnowledgeRelationshipSchema[];

  @Prop({ type: String })
  summary?: string;

  createdAt: Date;
  updatedAt: Date;
}



export const ChapterKnowledgeSchema = SchemaFactory.createForClass(ChapterKnowledge);
