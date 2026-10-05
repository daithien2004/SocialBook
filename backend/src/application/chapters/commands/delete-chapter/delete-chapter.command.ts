import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundDomainException, BadRequestDomainException } from "@/shared/domain/common-exceptions";
import { IChapterRepository } from "@/domain/chapters/repositories/chapter.repository.interface";
import { ChapterId } from "@/domain/chapters/value-objects/chapter-id.vo";
import { ErrorMessages } from "@/common/constants/error-messages";
import { Injectable } from "@nestjs/common";

export class DeleteChapterCommand extends Command<void> {
  constructor(public readonly id: string) { super(); }
}
