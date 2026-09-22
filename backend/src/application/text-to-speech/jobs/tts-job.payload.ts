export class GenerateAudioJobPayload {
  constructor(
    public readonly ttsRecordId: string,
    public readonly chapterId: string,
    public readonly text: string,
    public readonly voice: string,
    public readonly language: string,
    public readonly speed: number,
    public readonly format: string,
  ) {}
}
