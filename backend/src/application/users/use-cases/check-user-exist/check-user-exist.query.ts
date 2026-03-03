export class CheckUserExistQuery {
    constructor(
        public readonly email?: string,
        public readonly username?: string,
        public readonly id?: string
    ) { }
}
