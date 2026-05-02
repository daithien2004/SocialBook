export class AskAICommand {
  constructor(
    public readonly roomId: string,
    public readonly userId: string,
    public readonly question: string,
  ) {}
}
