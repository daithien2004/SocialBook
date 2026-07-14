export class VoteQuoteCommand {
  constructor(
    public readonly userId: string,
    public readonly roomId: string,
    public readonly quoteId: string,
    public readonly voteType: 'up' | 'down',
  ) {}
}
