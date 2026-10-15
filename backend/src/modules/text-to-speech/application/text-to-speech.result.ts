export interface GenerateBookAudioResult {
  total: number;
  successful: number;
  failed: number;
  generated: Array<{ chapterId: string; status: string; audioUrl?: string }>;
  errors: Array<{ chapterId: string; error: string }>;
}
