export class RecordReadingTimeCommand {
    constructor(
        public readonly userId: string,
        public readonly bookId: string,
        public readonly chapterId: string,
        public readonly durationInSeconds: number
    ) { }
}
