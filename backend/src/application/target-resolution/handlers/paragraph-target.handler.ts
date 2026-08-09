import { Injectable } from '@nestjs/common';
import { IChapterRepository } from '@/domain/chapters/repositories/chapter.repository.interface';
import {
  ITargetTypeHandler,
  TargetResolution,
} from '../interfaces/target-type-handler.interface';

@Injectable()
export class ParagraphTargetHandler implements ITargetTypeHandler {
  constructor(private readonly chapterRepository: IChapterRepository) {}

  type(): string {
    return 'paragraph';
  }

  async resolve(targetId: string): Promise<TargetResolution> {
    const chapter = await this.chapterRepository.findByParagraphId(targetId);
    if (!chapter) {
      return new TargetResolution();
    }
    return new TargetResolution(undefined, undefined, {
      targetType: 'chapter',
      targetId: chapter.id.toString(),
    });
  }
}
