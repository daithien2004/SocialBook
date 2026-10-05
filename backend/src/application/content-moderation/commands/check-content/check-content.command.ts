import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable } from "@nestjs/common";
import { ContentModerationService } from "@/application/content-moderation/services/content-moderation.service";
import { ModerationResult } from "@/domain/content-moderation/interfaces/moderation-result.interface";

export class CheckContentCommand extends Command<ModerationResult> {
  constructor() { super(); }
}
