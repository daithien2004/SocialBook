import { Injectable, BadRequestException } from '@nestjs/common';
import { IAIPort } from '@/domain/ai/interfaces/ai.port';
import { IAIRequestRepository } from '@/domain/ai/repositories/ai-request.repository.interface';
import {
  AIRequest,
  AIRequestType,
} from '@/domain/ai/entities/ai-request.entity';
import { UserId } from '@/domain/ai/value-objects/user-id.vo';
import { IIdGenerator } from '@/shared/domain/id-generator.interface';

export interface GenerateTextRequest {
  prompt: string;
  userId: string;
}

export interface GenerateTextResponse {
  response: string;
  requestId: string;
  responseLength: number;
}

@Injectable()
export class GenerateTextUseCase {
  constructor(
    private readonly aiService: IAIPort,
    private readonly aiRequestRepository: IAIRequestRepository,
    private readonly idGenerator: IIdGenerator,
  ) {}

  async execute(request: GenerateTextRequest): Promise<GenerateTextResponse> {
    UserId.create(request.userId);

    const aiRequest = AIRequest.create({
      id: this.idGenerator.generate(),
      prompt: request.prompt,
      type: AIRequestType.TEXT_GENERATION,
      userId: request.userId,
    });

    if (!aiRequest.hasValidPrompt()) {
      throw new BadRequestException(
        'Prompt must be between 1 and 10000 characters',
      );
    }

    try {
      const response = await this.aiService.generateText(request.prompt);

      aiRequest.setResponse(response);
      await this.aiRequestRepository.save(aiRequest);

      return {
        response,
        requestId: aiRequest.id.toString(),
        responseLength: aiRequest.getResponseLength(),
      };
    } catch (error) {
      await this.aiRequestRepository.save(aiRequest);
      throw error;
    }
  }
}
