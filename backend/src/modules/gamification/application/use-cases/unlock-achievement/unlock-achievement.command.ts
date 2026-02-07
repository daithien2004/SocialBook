export class UnlockAchievementCommand {
    constructor(
        public readonly userId: string,
        public readonly achievementId: string,
        public readonly progress?: number
    ) {}
}
