export class DeleteQuoteCommand {
  constructor(
    public readonly userId: string,
    public readonly roomCode: string,
    public readonly quoteId: string,
  ) {}
}
