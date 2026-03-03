export interface IReadingPreferences {
    theme: string;
    fontSize: number;
    fontFamily: string;
    lineHeight: number;
    letterSpacing: number;
    backgroundColor: string;
    textColor: string;
    textAlign: string;
    marginWidth: number;
    preferredGenres?: string[];
    dailyReadingGoal?: number;
}

export class ReadingPreferences {
    constructor(
        public readonly theme: string,
        public readonly fontSize: number,
        public readonly fontFamily: string,
        public readonly lineHeight: number,
        public readonly letterSpacing: number,
        public readonly backgroundColor: string,
        public readonly textColor: string,
        public readonly textAlign: string,
        public readonly marginWidth: number,
        public readonly preferredGenres: string[] = [],
        public readonly dailyReadingGoal: number = 0
    ) { }

    static createDefault(): ReadingPreferences {
        return new ReadingPreferences(
            'dark',
            18,
            'Georgia, serif',
            1.8,
            0.5,
            '#1a1a1a',
            '#e5e5e5',
            'justify',
            0,
            [],
            0
        );
    }

    static create(props: Partial<IReadingPreferences>): ReadingPreferences {
        const defaults = this.createDefault();
        return new ReadingPreferences(
            props.theme || defaults.theme,
            props.fontSize || defaults.fontSize,
            props.fontFamily || defaults.fontFamily,
            props.lineHeight || defaults.lineHeight,
            props.letterSpacing || defaults.letterSpacing,
            props.backgroundColor || defaults.backgroundColor,
            props.textColor || defaults.textColor,
            props.textAlign || defaults.textAlign,
            props.marginWidth || defaults.marginWidth,
            props.preferredGenres ?? defaults.preferredGenres,
            props.dailyReadingGoal ?? defaults.dailyReadingGoal
        );
    }
}
