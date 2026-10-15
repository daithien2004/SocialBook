import { Injectable } from '@nestjs/common';
import { TransactionHost } from '@nestjs-cls/transactional';
import { PrismaTransactionalAdapter } from '@/core/database/postgres/prisma-transaction.types';
import { TextToSpeechPlayCountStore } from '../../application/ports/text-to-speech-play-count.store';

@Injectable()
export class PrismaTextToSpeechPlayCountStore extends TextToSpeechPlayCountStore {
  constructor(
    private readonly transactionHost: TransactionHost<PrismaTransactionalAdapter>,
  ) {
    super();
  }

  async incrementCompletedByChapterId(chapterId: string): Promise<void> {
    await this.transactionHost.tx.textToSpeech.updateMany({
      where: { chapterId, status: 'completed' },
      data: {
        playCount: { increment: 1 },
        lastPlayedAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }
}
