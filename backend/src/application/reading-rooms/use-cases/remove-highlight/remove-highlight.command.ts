export class RemoveHighlightCommand {
  constructor(
    public readonly roomId: string,
    public readonly userId: string,
    public readonly highlightId: string,
  ) {}
}
