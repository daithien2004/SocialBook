import { Command } from '@nestjs/cqrs';
import { IReadingProgressRepository } from "@/domain/library/repositories/reading-progress.repository.interface";
import { UserId } from "@/domain/library/value-objects/user-id.vo";
import { ChapterId } from "@/domain/library/value-objects/chapter-id.vo";
import { ReadingProgress } from "@/domain/library/entities/reading-progress.entity";
import { IIdGenerator } from "@/shared/domain/id-generator.interface";

import { RecordReadingTimeResult } from '@/application/library/commands/record-reading-time/record-reading-time.handler';

export class RecordReadingTimeCommand extends Command<RecordReadingTimeResult> {
  constructor(
    public readonly userId: string,
    public readonly bookId: string,
    public readonly chapterId: string,
    public readonly durationInSeconds: number,
  ) { super(); }
}
