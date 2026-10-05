import { Query } from '@nestjs/cqrs';
import { NotFoundDomainException, BadRequestDomainException } from "@/shared/domain/common-exceptions";
import { IChapterRepository } from "@/domain/chapters/repositories/chapter.repository.interface";
import { ChapterId } from "@/domain/chapters/value-objects/chapter-id.vo";
import { ErrorMessages } from "@/common/constants/error-messages";

import { ChapterResult } from '@/application/chapters/queries/get-chapters/get-chapters.result';

export class GetChapterByIdQuery extends Query<ChapterResult> {
  constructor(public readonly id: string) { super(); }
}
