export class RemoveFromLibraryCommand {
    constructor(
        public readonly userId: string,
        public readonly bookId: string
    ) { }
}
