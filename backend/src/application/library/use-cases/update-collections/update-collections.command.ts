export class UpdateCollectionsCommand {
    constructor(
        public readonly userId: string,
        public readonly bookId: string,
        public readonly collectionIds: string[]
    ) { }
}
