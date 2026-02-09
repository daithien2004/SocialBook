export class UpdateReadingPreferencesCommand {
    constructor(
        public readonly userId: string,
        public readonly theme?: string,
        public readonly fontSize?: number,
        public readonly fontFamily?: string,
        public readonly lineHeight?: number,
        public readonly letterSpacing?: number,
        public readonly backgroundColor?: string,
        public readonly textColor?: string,
        public readonly textAlign?: string,
        public readonly marginWidth?: number,
        public readonly preferredGenres?: string[],
        public readonly dailyReadingGoal?: number
    ) { }
}
