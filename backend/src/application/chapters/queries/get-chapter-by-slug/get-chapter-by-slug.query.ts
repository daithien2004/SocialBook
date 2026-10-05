import { Query } from '@nestjs/cqrs';
import { ErrorMessages } from "@/common/constants/error-messages";
import { ChapterDetailReadModel } from "@/domain/chapters/read-models/chapter-detail.read-model";
import { IChapterRepository } from "@/domain/chapters/repositories/chapter.repository.interface";
import { NotFoundDomainException } from "@/shared/domain/common-exceptions";

export class GetChapterBySlugQuery extends Query<ChapterDetailReadModel> {
  constructor(
    public readonly chapterSlug: string,
    public readonly bookSlug: string,
  ) { super(); }
}
