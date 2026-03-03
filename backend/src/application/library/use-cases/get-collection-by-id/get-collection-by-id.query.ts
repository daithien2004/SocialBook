export class GetCollectionByIdQuery {
    constructor(
        public readonly userId: string,
        public readonly collectionId: string
    ) { }
}
