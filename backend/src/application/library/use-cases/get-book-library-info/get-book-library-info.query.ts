export class GetBookLibraryInfoQuery {
    constructor(
        public readonly userId: string,
        public readonly bookId: string
    ) { }
}
