export class CreateGenreCommand {
    constructor(
        public readonly name: string,
        public readonly description?: string
    ) {}
}
