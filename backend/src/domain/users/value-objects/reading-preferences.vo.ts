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
  warmth: number;
  brightness: number;
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
    public readonly warmth: number,
    public readonly brightness: number,
    public readonly preferredGenres: string[] = [],
    public readonly dailyReadingGoal: number = 0,
  ) {}

  static createDefault(): ReadingPreferences {
    return new ReadingPreferences(
      'dark',
      19, // Match frontend fontSize 19
      'var(--font-merriweather), serif',
      1.7, // Match frontend lineHeight
      0.2, // Match frontend letterSpacing
      '#1c1e1eff', // Match frontend backgroundColor
      '#d8d3c8', // Match frontend textColor
      'justify',
      52, // Match frontend marginWidth
      30, // Match frontend warmth
      100,
      [],
      0,
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
      props.marginWidth ?? defaults.marginWidth,
      props.warmth ?? defaults.warmth,
      props.brightness ?? defaults.brightness,
      props.preferredGenres ?? defaults.preferredGenres,
      props.dailyReadingGoal ?? defaults.dailyReadingGoal,
    );
  }
}
