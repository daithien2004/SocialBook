import { GenerateTextCommand } from './generate-text.command';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  BadRequestDomainException,
  ForbiddenDomainException,
} from '@/shared/domain/common-exceptions';
import { IAIPort } from '@/modules/ai/domain/interfaces/ai.port';
import { IAIRequestRepository } from '@/modules/ai/domain/repositories/ai-request.repository.interface';
import {
  AIRequest,
  AIRequestType,
} from '@/modules/ai/domain/entities/ai-request.entity';
import { IIdGenerator } from '@/shared/domain/id-generator.interface';
import type { GenerateTextResult } from '@/modules/ai/application/ai.result';
import { Transactional } from '@nestjs-cls/transactional';

@CommandHandler(GenerateTextCommand)
export class GenerateTextHandler implements ICommandHandler<GenerateTextCommand> {
  constructor(
    private readonly aiService: IAIPort,
    private readonly aiRequestRepository: IAIRequestRepository,
    private readonly idGenerator: IIdGenerator,
  ) {}

  async execute(command: GenerateTextCommand): Promise<GenerateTextResult> {
    if (!command.actor.ability.can('create', 'AIRequest')) {
      throw new ForbiddenDomainException('AI_REQUEST_CREATE_FORBIDDEN');
    }

    const prompt = command.prompt.trim();
    if (prompt.length < 1 || prompt.length > 10000) {
      throw new BadRequestDomainException(
        'Prompt must be between 1 and 10000 characters',
      );
    }

    const requestId = this.idGenerator.generate();
    const aiRequest =
      command.actor.userId === 'anonymous'
        ? null
        : AIRequest.create({
            id: requestId,
            prompt,
            type: AIRequestType.TEXT_GENERATION,
            userId: command.actor.userId,
          });

    try {
      const response = await this.aiService.generateText(prompt);

      if (aiRequest) {
        aiRequest.setResponse(response);
        await this.saveRequest(aiRequest);
      }

      return {
        response,
        requestId,
        responseLength: response.length,
      };
    } catch (error) {
      if (aiRequest) await this.saveRequest(aiRequest);
      throw error;
    }
  }

  @Transactional()
  private async saveRequest(request: AIRequest): Promise<void> {
    await this.aiRequestRepository.save(request);
  }
}
