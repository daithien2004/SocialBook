import { Injectable } from '@nestjs/common';
import { TransactionHost } from '@nestjs-cls/transactional';
import { PrismaTransactionalAdapter } from '@/core/database/postgres/prisma-transaction.types';
import { accessibleBy } from '@/shared/casl/accessible-by';
import type { AppAbility } from '@/shared/casl/app-ability';
import type { TextToSpeech as PrismaTextToSpeech } from '@/core/database/generated/prisma/client';
import type { TextToSpeechReadModel } from '../../application/read-models/text-to-speech.read-model';
import { TextToSpeechReadRepository } from '../../application/ports/text-to-speech-read.repository';

@Injectable()
export class PrismaTextToSpeechReadRepository extends TextToSpeechReadRepository {
  constructor(
    private readonly transactionHost: TransactionHost<PrismaTransactionalAdapter>,
  ) {
    super();
  }

  async findAccessibleById(
    ability: AppAbility,
    id: string,
  ): Promise<TextToSpeechReadModel | null> {
    const row = await this.transactionHost.tx.textToSpeech.findFirst({
      where: {
        AND: [{ id }, accessibleBy(ability).ofType('TextToSpeech')],
      },
    });
    return row ? this.toReadModel(row) : null;
  }

  async findCompletedByChapterId(
    ability: AppAbility,
    chapterId: string,
  ): Promise<TextToSpeechReadModel | null> {
    const row = await this.transactionHost.tx.textToSpeech.findFirst({
      where: {
        AND: [
          accessibleBy(ability).ofType('TextToSpeech'),
          { chapterId, status: 'completed' },
        ],
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });
    return row ? this.toReadModel(row) : null;
  }

  private toReadModel(row: PrismaTextToSpeech): TextToSpeechReadModel {
    return {
      id: row.id,
      chapterId: row.chapterId,
      bookId: row.bookId,
      voice: row.voice,
      language: row.language,
      speed: row.speed,
      status: row.status,
      audioUrl: row.audioUrl ?? undefined,
      audioFormat: row.audioFormat ?? undefined,
      audioDuration: row.audioDuration ?? undefined,
      characterCount: row.characterCount ?? undefined,
      paragraphCount: row.paragraphCount ?? undefined,
      provider: row.provider ?? undefined,
      playCount: row.playCount,
      lastPlayedAt: row.lastPlayedAt ?? undefined,
      processedAt: row.processedAt ?? undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
