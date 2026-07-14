export interface ReadingPreferences {
    theme: 'light' | 'dark' | 'sepia' | 'paper';
    fontSize: number;
    fontFamily: string;
    lineHeight: number;
    letterSpacing: number;
    backgroundColor: string;
    textColor: string;
    textAlign: 'left' | 'center' | 'justify';
    marginWidth: number;
    warmth: number;
    brightness: number;
}

export interface UpdateReadingPreferencesDto {
    theme?: 'light' | 'dark' | 'sepia' | 'paper';
    fontSize?: number;
    fontFamily?: string;
    lineHeight?: number;
    letterSpacing?: number;
    backgroundColor?: string;
    textColor?: string;
    textAlign?: 'left' | 'center' | 'justify';
    marginWidth?: number;
    warmth?: number;
    brightness?: number;
}
