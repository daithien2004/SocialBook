import { Inject } from '@nestjs/common';
import { INFRASTRUCTURE_TOKENS } from '../../../domain/tokens/gemini.tokens';
import type { IGeminiService } from '../../../domain/services/gemini.service.interface';
import type { IAIRequestRepository } from '../../../domain/repositories/ai-request.repository.interface';
import { AIRequest, AIRequestType } from '../../../domain/entities/ai-request.entity';
import { UserId } from '../../../domain/value-objects/user-id.vo';

export interface GenerateTextRequest {
    prompt: string;
    userId: string;
}

export interface GenerateTextResponse {
    response: string;
    requestId: string;
    responseLength: number;
}

export class GenerateTextUseCase {
    constructor(
        @Inject(INFRASTRUCTURE_TOKENS.GEMINI_SERVICE)
        private readonly geminiService: IGeminiService,
        @Inject(INFRASTRUCTURE_TOKENS.AI_REQUEST_REPOSITORY)
        private readonly aiRequestRepository: IAIRequestRepository
    ) {}

    async execute(request: GenerateTextRequest): Promise<GenerateTextResponse> {
        const userId = UserId.create(request.userId);
        
        const aiRequest = AIRequest.create({
            prompt: request.prompt,
            type: AIRequestType.TEXT_GENERATION,
            userId: request.userId
        });

        if (!aiRequest.hasValidPrompt()) {
            throw new Error('Prompt must be between 1 and 10000 characters');
        }

        try {
            const response = await this.geminiService.generateText(request.prompt);
            
            aiRequest.setResponse(response);
            await this.aiRequestRepository.save(aiRequest);

            return {
                response,
                requestId: aiRequest.id.toString(),
                responseLength: aiRequest.getResponseLength()
            };
        } catch (error) {
            await this.aiRequestRepository.save(aiRequest);
            throw error;
        }
    }
}
