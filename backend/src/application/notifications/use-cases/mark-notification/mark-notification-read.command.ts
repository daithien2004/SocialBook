export class MarkNotificationReadCommand {
    constructor(
        public readonly userId: string,
        public readonly notificationId: string
    ) { }
}
