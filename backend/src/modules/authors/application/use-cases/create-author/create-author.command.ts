export class CreateAuthorCommand {
    constructor(
        public readonly name: string,
        public readonly bio?: string,
        public readonly photoUrl?: string
    ) {}
}
