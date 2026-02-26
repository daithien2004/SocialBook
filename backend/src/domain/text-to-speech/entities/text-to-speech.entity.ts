import { Entity } from '@/shared/domain/entity.base';

export enum TTSStatus {
    PENDING = 'pending',
    PROCESSING = 'processing',
    COMPLETED = 'completed',
    FAILED = 'failed',
}

export enum TTSVoiceType {
    MALE = 'male',
    FEMALE = 'female',
    NEUTRAL = 'neutral',
}

export class TextToSpeech extends Entity<string> {
    private constructor(
        id: string,
        private _chapterId: string,
        private _bookId: string,
        private _text: string,
        private _voice: string,
        private _language: string,
        private _speed: number,
        private _status: TTSStatus,
        private _audioUrl?: string,
        private _audioFormat?: string,
        private _audioDuration?: number,
        private _characterCount?: number,
        private _paragraphCount?: number,
        private _errorMessage?: string,
        private _provider?: string,
        private _playCount: number = 0,
        private _lastPlayedAt?: Date,
        private _processedAt?: Date,
        createdAt?: Date,
        updatedAt?: Date
    ) {
        super(id, createdAt, updatedAt);
    }

    public static create(props: {
        id: string;
        chapterId: string;
        bookId: string;
        text: string;
        voice: string;
        language: string;
        speed: number;
        status?: TTSStatus;
        audioUrl?: string;
        audioFormat?: string;
        audioDuration?: number;
        characterCount?: number;
        paragraphCount?: number;
        provider?: string;
    }): TextToSpeech {
        return new TextToSpeech(
            props.id,
            props.chapterId,
            props.bookId,
            props.text,
            props.voice,
            props.language,
            props.speed,
            props.status || TTSStatus.PENDING,
            props.audioUrl,
            props.audioFormat,
            props.audioDuration,
            props.characterCount,
            props.paragraphCount,
            undefined,
            props.provider,
            0,
            undefined,
            undefined
        );
    }

    public static reconstitute(props: {
        id: string;
        chapterId: string;
        bookId: string;
        text: string;
        voice: string;
        language: string;
        speed: number;
        status: TTSStatus;
        audioUrl?: string;
        audioFormat?: string;
        audioDuration?: number;
        characterCount?: number;
        paragraphCount?: number;
        errorMessage?: string;
        provider?: string;
        playCount: number;
        lastPlayedAt?: Date;
        processedAt?: Date;
        createdAt: Date;
        updatedAt: Date;
    }): TextToSpeech {
        return new TextToSpeech(
            props.id,
            props.chapterId,
            props.bookId,
            props.text,
            props.voice,
            props.language,
            props.speed,
            props.status,
            props.audioUrl,
            props.audioFormat,
            props.audioDuration,
            props.characterCount,
            props.paragraphCount,
            props.errorMessage,
            props.provider,
            props.playCount,
            props.lastPlayedAt,
            props.processedAt,
            props.createdAt,
            props.updatedAt
        );
    }

    get chapterId(): string { return this._chapterId; }
    get bookId(): string { return this._bookId; }
    get text(): string { return this._text; }
    get voice(): string { return this._voice; }
    get language(): string { return this._language; }
    get speed(): number { return this._speed; }
    get status(): TTSStatus { return this._status; }
    get audioUrl(): string | undefined { return this._audioUrl; }
    get audioFormat(): string | undefined { return this._audioFormat; }
    get audioDuration(): number | undefined { return this._audioDuration; }
    get playCount(): number { return this._playCount; }
    get lastPlayedAt(): Date | undefined { return this._lastPlayedAt; }
    get processedAt(): Date | undefined { return this._processedAt; }
    get errorMessage(): string | undefined { return this._errorMessage; }

    public complete(audioUrl: string, format: string, duration?: number): void {
        this._status = TTSStatus.COMPLETED;
        this._audioUrl = audioUrl;
        this._audioFormat = format;
        this._audioDuration = duration;
        this._processedAt = new Date();
        this.markAsUpdated();
    }

    public fail(errorMessage: string): void {
        this._status = TTSStatus.FAILED;
        this._errorMessage = errorMessage;
        this.markAsUpdated();
    }

    public incrementPlayCount(): void {
        this._playCount = this._playCount + 1;
        this._lastPlayedAt = new Date();
    }
}
