export interface TextToSpeechReadModel {
  id: string;
  chapterId: string;
  bookId: string;
  voice: string;
  language: string;
  speed: number;
  status: string;
  audioUrl?: string;
  audioFormat?: string;
  audioDuration?: number;
  characterCount?: number;
  paragraphCount?: number;
  provider?: string;
  playCount: number;
  lastPlayedAt?: Date;
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
