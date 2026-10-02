export class GenerateHighlightInsightCommand {
  constructor(
    public readonly userId: string,
    public readonly roomId: string,
    public readonly highlightId: string,
  ) {}
}
