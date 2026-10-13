import {
  Prisma,
  TextToSpeech as TextToSpeechRow,
} from '@/core/database/generated/prisma/client';
import {
  TextToSpeech,
  TTSStatus,
} from '@/modules/text-to-speech/domain/entities/text-to-speech.entity';

const TTS_STATUSES = [
  TTSStatus.PENDING,
  TTSStatus.PROCESSING,
  TTSStatus.COMPLETED,
  TTSStatus.FAILED,
] as const;

function toStatus(value: string): TTSStatus {
  const status = TTS_STATUSES.find(
    (candidate) => candidate.valueOf() === value,
  );
  if (!status) throw new Error(`Unknown text-to-speech status: ${value}`);
  return status;
}

export const TextToSpeechMapper = {
  toDomain(row: TextToSpeechRow): TextToSpeech {
    return TextToSpeech.reconstitute({
      id: row.id,
      chapterId: row.chapterId,
      bookId: row.bookId,
      text: row.text,
      voice: row.voice,
      language: row.language,
      speed: row.speed,
      status: toStatus(row.status),
      audioUrl: row.audioUrl ?? undefined,
      audioFormat: row.audioFormat ?? undefined,
      audioDuration: row.audioDuration ?? undefined,
      characterCount: row.characterCount ?? undefined,
      paragraphCount: row.paragraphCount ?? undefined,
      errorMessage: row.errorMessage ?? undefined,
      provider: row.provider ?? undefined,
      playCount: row.playCount,
      lastPlayedAt: row.lastPlayedAt ?? undefined,
      processedAt: row.processedAt ?? undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  },

  toCreateInput(entity: TextToSpeech): Prisma.TextToSpeechUncheckedCreateInput {
    return {
      id: entity.id,
      chapterId: entity.chapterId,
      bookId: entity.bookId,
      text: entity.text,
      voice: entity.voice,
      language: entity.language,
      speed: entity.speed,
      status: entity.status,
      audioUrl: entity.audioUrl ?? null,
      audioFormat: entity.audioFormat ?? 'mp3',
      audioDuration: entity.audioDuration ?? null,
      characterCount: entity.characterCount ?? entity.text.length,
      paragraphCount: entity.paragraphCount ?? null,
      errorMessage: entity.errorMessage ?? null,
      provider: entity.provider ?? null,
      playCount: entity.playCount,
      lastPlayedAt: entity.lastPlayedAt ?? null,
      processedAt: entity.processedAt ?? null,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  },
};
