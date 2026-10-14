export abstract class ReadingRoomReferencePort {
  abstract hasActiveRoomForChapter(chapterId: string): Promise<boolean>;
  abstract hasActiveRoomForBook(bookId: string): Promise<boolean>;
}
