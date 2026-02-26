import { ErrorMessages } from "@/common/constants/error-messages";
import { ChapterDetailReadModel } from "@/domain/chapters/read-models/chapter-detail.read-model";
import { IChapterRepository } from "@/domain/chapters/repositories/chapter.repository.interface";
import { Injectable, NotFoundException } from "@nestjs/common";
import { GetChapterBySlugQuery } from "./get-chapter-by-slug.query";

@Injectable()
export class GetChapterBySlugUseCase {
    constructor(
        private readonly chapterRepository: IChapterRepository
    ) { }

    async execute(query: GetChapterBySlugQuery): Promise<ChapterDetailReadModel> {
        const result = await this.chapterRepository.findDetailBySlug(query.chapterSlug, query.bookSlug);
        if (!result) {
            throw new NotFoundException(ErrorMessages.CHAPTER_NOT_FOUND);
        }
        return result;
    }
}