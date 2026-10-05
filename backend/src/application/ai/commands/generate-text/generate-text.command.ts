import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, BadRequestException } from "@nestjs/common";
import { IAIPort } from "@/domain/ai/interfaces/ai.port";
import { IAIRequestRepository } from "@/domain/ai/repositories/ai-request.repository.interface";
import { AIRequest, AIRequestType } from "@/domain/ai/entities/ai-request.entity";
import { UserId } from "@/domain/ai/value-objects/user-id.vo";
import { IIdGenerator } from "@/shared/domain/id-generator.interface";

import { GenerateTextResult } from '@/application/ai/commands/generate-text/generate-text.handler';

export class GenerateTextCommand extends Command<GenerateTextResult> {
  constructor(
    public readonly prompt: string,
    public readonly userId: string,
  ) { super(); }
}
