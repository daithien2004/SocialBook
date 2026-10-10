import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AIRequest, IAIRequestRepository } from '@/modules/ai/domain';
import {
  AIRequestDocument,
  AIRequest as AIRequestModelClass,
} from '../../schemas/ai-request.schema';
import { AIRequestPersistence } from './ai-request.mapper';

@Injectable()
export class AIRequestRepository implements IAIRequestRepository {
  constructor(
    @InjectModel(AIRequestModelClass.name)
    private readonly aiRequestModel: Model<AIRequestDocument>,
  ) {}

  private toPersistence(request: AIRequest): AIRequestPersistence {
    return {
      prompt: request.prompt,
      response: request.response,
      type: request.type,
      userId: request.userId.toString(),
      metadata: request.metadata,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
    };
  }

  async save(request: AIRequest): Promise<void> {
    await this.aiRequestModel
      .findByIdAndUpdate(
        request.id.toString(),
        { $set: this.toPersistence(request) },
        { upsert: true },
      )
      .exec();
  }
}
