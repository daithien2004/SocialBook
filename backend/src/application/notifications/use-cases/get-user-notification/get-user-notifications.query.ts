export class GetUserNotificationsQuery {
    constructor(
        public readonly userId: string,
        public readonly page: number = 1,
        public readonly limit: number = 50,
        public readonly isRead?: boolean
    ) { }
}
