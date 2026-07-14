import { Injectable, NotFoundException } from '@nestjs/common';
import { IBookmarkRepository } from '@/domain/bookmarks/repositories/bookmark.repository.interface';

export class DeleteBookmarkCommand {
  constructor(
    public readonly userId: string,
    public readonly paragraphId: string,
  ) {}
}

@Injectable()
export class DeleteBookmarkUseCase {
  constructor(private readonly bookmarkRepository: IBookmarkRepository) {}

  async execute(command: DeleteBookmarkCommand): Promise<void> {
    const existing = await this.bookmarkRepository.findByParagraph(
      command.userId,
      command.paragraphId,
    );
    if (!existing) {
      throw new NotFoundException('Bookmark not found');
    }

    await this.bookmarkRepository.deleteByParagraph(
      command.userId,
      command.paragraphId,
    );
  }
}
