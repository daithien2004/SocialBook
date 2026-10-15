export abstract class TextToSpeechPlayCountStore {
  abstract incrementCompletedByChapterId(chapterId: string): Promise<void>;
}
