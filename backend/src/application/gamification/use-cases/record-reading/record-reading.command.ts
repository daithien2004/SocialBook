export class RecordReadingCommand {
    constructor(
        public readonly userId: string,
        public readonly xpAmount: number = 10
    ) {}
}
