import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from "@nestjs/common";
import { IVectorRepository } from "@/domain/chroma/repositories/vector.repository.interface";

export class ClearCollectionCommand extends Command<{ success: boolean; }> {
  constructor() { super(); }
}
