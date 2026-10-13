export abstract class IReadingRoomReferencePort {
  abstract hasActiveRoomForChapter(chapterId: string): Promise<boolean>;
  abstract hasActiveRoomForBook(bookId: string): Promise<boolean>;
}
