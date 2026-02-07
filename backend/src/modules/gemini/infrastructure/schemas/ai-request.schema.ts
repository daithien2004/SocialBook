import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { AIRequestType } from '../../domain/entities/ai-request.entity';

export type AIRequestDocument = HydratedDocument<AIRequestSchema>;

import { BaseSchema } from '../../../../shared/schemas/base.schema';

@Schema({ timestamps: true })
export class AIRequestSchema extends BaseSchema {
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

export const AIRequestSchemaDefinition = SchemaFactory.createForClass(AIRequestSchema);

AIRequestSchemaDefinition.index({ userId: 1, createdAt: -1 });
AIRequestSchemaDefinition.index({ type: 1, createdAt: -1 });
AIRequestSchemaDefinition.index({ createdAt: -1 });
