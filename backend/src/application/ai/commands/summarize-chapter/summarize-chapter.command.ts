import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable } from "@nestjs/common";
import { NotFoundDomainException } from "@/shared/domain/common-exceptions";
import { IAIPort } from "@/domain/ai/interfaces/ai.port";
import { IAIRequestRepository } from "@/domain/ai/repositories/ai-request.repository.interface";
import { IChapterRepository } from "@/domain/chapters/repositories/chapter.repository.interface";
import { ChapterId } from "@/domain/chapters/value-objects/chapter-id.vo";
import { AIRequest, AIRequestType } from "@/domain/ai/entities/ai-request.entity";
import { IIdGenerator } from "@/shared/domain/id-generator.interface";

import { SummarizeChapterResult } from '@/application/ai/commands/summarize-chapter/summarize-chapter.handler';

export class SummarizeChapterCommand extends Command<SummarizeChapterResult> {
  constructor(
    public readonly chapterId: string,
    public readonly userId: string,
  ) { super(); }
}
