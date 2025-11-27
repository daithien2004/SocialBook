export interface ReadingPreferences {
    theme: 'light' | 'dark' | 'sepia';
    fontSize: number;
    fontFamily: string;
    lineHeight: number;
    letterSpacing: number;
    backgroundColor: string;
    textColor: string;
    textAlign: 'left' | 'center' | 'justify';
    marginWidth: number;
}

export interface UpdateReadingPreferencesDto {
    theme?: 'light' | 'dark' | 'sepia';
    fontSize?: number;
    fontFamily?: string;
    lineHeight?: number;
    letterSpacing?: number;
    backgroundColor?: string;
    textColor?: string;
    textAlign?: 'left' | 'center' | 'justify';
    marginWidth?: number;
}
