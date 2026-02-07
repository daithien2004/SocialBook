export class GetUsersQuery {
    constructor(
        public readonly page: number,
        public readonly limit: number,
        public readonly username?: string,
        public readonly email?: string,
        public readonly roleId?: string,
        public readonly isBanned?: boolean,
        public readonly isVerified?: boolean
    ) {}
}
