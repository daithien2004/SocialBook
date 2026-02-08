import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { AIRequestType } from '@/domain/gemini/entities/ai-request.entity';

export type AIRequestDocument = HydratedDocument<AIRequest>;

import { BaseSchema } from '@/shared/schemas/base.schema';

@Schema({ timestamps: true })
export class AIRequest extends BaseSchema {
  @Prop({ required: true, maxlength: 10000 })
  prompt: string;

  @Prop({ type: String, default: null })
  response: string;

  @Prop({ required: true, enum: AIRequestType })
  type: AIRequestType;

  @Prop({ required: true })
  userId: string;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;
}

export const AIRequestSchema = SchemaFactory.createForClass(AIRequest);

AIRequestSchema.index({ userId: 1, createdAt: -1 });
AIRequestSchema.index({ type: 1, createdAt: -1 });
AIRequestSchema.index({ createdAt: -1 });

