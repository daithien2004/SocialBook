import { AIRequest, AIRequestType } from '@/domain/gemini/entities/ai-request.entity';
import { AIRequestDocument } from '@/infrastructure/database/schemas/ai-request.schema';
import { Types } from 'mongoose';

interface AIRequestPersistence {
  _id: Types.ObjectId;
  prompt: string;
  response: string | null;
  type: AIRequestType;
  userId: string;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export class AIRequestMapper {
  static toDomain(doc: AIRequestDocument | any): AIRequest {
    return AIRequest.reconstitute({
      id: doc._id.toString(),
      prompt: doc.prompt,
      response: doc.response || null,
      type: doc.type,
      userId: doc.userId,
      metadata: doc.metadata || {},
      createdAt: doc.createdAt as Date,
      updatedAt: doc.updatedAt as Date
    });
  }

  static toPersistence(request: AIRequest): AIRequestPersistence {
    return {
      _id: new Types.ObjectId(request.id.toString()),
      prompt: request.prompt,
      response: request.response,
      type: request.type,
      userId: request.userId.toString(),
      metadata: request.metadata,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt
    };
  }
}
