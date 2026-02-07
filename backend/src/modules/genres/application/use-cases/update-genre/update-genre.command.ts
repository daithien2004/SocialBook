export class UpdateGenreCommand {
    constructor(
        public readonly id: string,
        public readonly name?: string,
        public readonly description?: string
    ) {}
}
