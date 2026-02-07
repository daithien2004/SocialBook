// import { AggregateRoot } from '@/src/common/base/aggregate-root'; 
// import { ChapterId } from '../../chapters/domain/value-objects/chapter-id.vo'; 
// import { BookId } from '../../books/domain/value-objects/book-id.vo';

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

export interface TextToSpeechProps {
    id?: string;
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
    playCount?: number;
    lastPlayedAt?: Date;
    createdAt?: Date;
    updatedAt?: Date;
    processedAt?: Date;
}

export class TextToSpeech {
    private props: TextToSpeechProps;

    private constructor(props: TextToSpeechProps) {
        this.props = props;
    }

    public static create(props: TextToSpeechProps): TextToSpeech {
        return new TextToSpeech({
            ...props,
            status: props.status || TTSStatus.PENDING,
            playCount: props.playCount || 0,
            createdAt: props.createdAt || new Date(),
            updatedAt: props.updatedAt || new Date(),
        });
    }

    public static reconstitute(props: TextToSpeechProps): TextToSpeech {
        return new TextToSpeech(props);
    }

    get id(): string | undefined { return this.props.id; }
    get chapterId(): string { return this.props.chapterId; }
    get bookId(): string { return this.props.bookId; }
    get text(): string { return this.props.text; }
    get voice(): string { return this.props.voice; }
    get language(): string { return this.props.language; }
    get speed(): number { return this.props.speed; }
    get status(): TTSStatus { return this.props.status; }
    get audioUrl(): string | undefined { return this.props.audioUrl; }
    get audioFormat(): string | undefined { return this.props.audioFormat; }
    get audioDuration(): number | undefined { return this.props.audioDuration; }
    get playCount(): number { return this.props.playCount || 0; }
    get lastPlayedAt(): Date | undefined { return this.props.lastPlayedAt; }
    get createdAt(): Date | undefined { return this.props.createdAt; }
    get updatedAt(): Date | undefined { return this.props.updatedAt; }
    get processedAt(): Date | undefined { return this.props.processedAt; }
    get errorMessage(): string | undefined { return this.props.errorMessage; }

    public complete(audioUrl: string, format: string, duration?: number): void {
        this.props.status = TTSStatus.COMPLETED;
        this.props.audioUrl = audioUrl;
        this.props.audioFormat = format;
        this.props.audioDuration = duration;
        this.props.processedAt = new Date();
        this.props.updatedAt = new Date();
    }

    public fail(errorMessage: string): void {
        this.props.status = TTSStatus.FAILED;
        this.props.errorMessage = errorMessage;
        this.props.updatedAt = new Date();
    }

    public incrementPlayCount(): void {
        this.props.playCount = (this.props.playCount || 0) + 1;
        this.props.lastPlayedAt = new Date();
    }
}
