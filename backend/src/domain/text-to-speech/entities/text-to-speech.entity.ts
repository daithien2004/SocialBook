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

export interface TextToSpeechProps {
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
}

export class TextToSpeech extends Entity<string> {
  private _props: TextToSpeechProps;

  private constructor(
    id: string,
    props: TextToSpeechProps,
    createdAt?: Date,
    updatedAt?: Date,
  ) {
    super(id, createdAt, updatedAt);
    this._props = props;
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
    return new TextToSpeech(props.id, {
      chapterId: props.chapterId,
      bookId: props.bookId,
      text: props.text,
      voice: props.voice,
      language: props.language,
      speed: props.speed,
      status: props.status || TTSStatus.PENDING,
      audioUrl: props.audioUrl,
      audioFormat: props.audioFormat,
      audioDuration: props.audioDuration,
      characterCount: props.characterCount,
      paragraphCount: props.paragraphCount,
      errorMessage: undefined,
      provider: props.provider,
      playCount: 0,
      lastPlayedAt: undefined,
      processedAt: undefined,
    });
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
      {
        chapterId: props.chapterId,
        bookId: props.bookId,
        text: props.text,
        voice: props.voice,
        language: props.language,
        speed: props.speed,
        status: props.status,
        audioUrl: props.audioUrl,
        audioFormat: props.audioFormat,
        audioDuration: props.audioDuration,
        characterCount: props.characterCount,
        paragraphCount: props.paragraphCount,
        errorMessage: props.errorMessage,
        provider: props.provider,
        playCount: props.playCount,
        lastPlayedAt: props.lastPlayedAt,
        processedAt: props.processedAt,
      },
      props.createdAt,
      props.updatedAt,
    );
  }

  get chapterId(): string {
    return this._props.chapterId;
  }
  get bookId(): string {
    return this._props.bookId;
  }
  get text(): string {
    return this._props.text;
  }
  get voice(): string {
    return this._props.voice;
  }
  get language(): string {
    return this._props.language;
  }
  get speed(): number {
    return this._props.speed;
  }
  get status(): TTSStatus {
    return this._props.status;
  }
  get audioUrl(): string | undefined {
    return this._props.audioUrl;
  }
  get audioFormat(): string | undefined {
    return this._props.audioFormat;
  }
  get audioDuration(): number | undefined {
    return this._props.audioDuration;
  }
  get playCount(): number {
    return this._props.playCount;
  }
  get lastPlayedAt(): Date | undefined {
    return this._props.lastPlayedAt;
  }
  get processedAt(): Date | undefined {
    return this._props.processedAt;
  }
  get errorMessage(): string | undefined {
    return this._props.errorMessage;
  }

  public complete(audioUrl: string, format: string, duration?: number): void {
    this._props.status = TTSStatus.COMPLETED;
    this._props.audioUrl = audioUrl;
    this._props.audioFormat = format;
    this._props.audioDuration = duration;
    this._props.processedAt = new Date();
    this.markAsUpdated();
  }

  public fail(errorMessage: string): void {
    this._props.status = TTSStatus.FAILED;
    this._props.errorMessage = errorMessage;
    this.markAsUpdated();
  }

  public incrementPlayCount(): void {
    this._props.playCount = this._props.playCount + 1;
    this._props.lastPlayedAt = new Date();
  }
}
