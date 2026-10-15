import { Injectable } from '@nestjs/common';
import { TransactionHost } from '@nestjs-cls/transactional';
import { PrismaTransactionalAdapter } from '@/core/database/postgres/prisma-transaction.types';
import { TextToSpeechRepository } from '@/modules/text-to-speech/domain/repositories/text-to-speech.repository';
import {
  TextToSpeech,
  TTSStatus,
} from '@/modules/text-to-speech/domain/entities/text-to-speech.entity';
import { TextToSpeechMapper } from './text-to-speech.mapper';

@Injectable()
export class PrismaTextToSpeechRepository implements TextToSpeechRepository {
  constructor(
    private readonly transactionHost: TransactionHost<PrismaTransactionalAdapter>,
  ) {}

  async findById(id: string): Promise<TextToSpeech | null> {
    const row = await this.transactionHost.tx.textToSpeech.findUnique({
      where: { id },
    });
    return row ? TextToSpeechMapper.toDomain(row) : null;
  }

  async findExisting(
    chapterId: string,
    language: string,
    voice: string,
    speed: number,
    format: string,
  ): Promise<TextToSpeech | null> {
    const row = await this.transactionHost.tx.textToSpeech.findFirst({
      where: {
        chapterId,
        status: TTSStatus.COMPLETED,
        language,
        voice,
        speed,
        audioFormat: format,
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });
    return row ? TextToSpeechMapper.toDomain(row) : null;
  }

  async save(entity: TextToSpeech): Promise<TextToSpeech> {
    const data = TextToSpeechMapper.toCreateInput(entity);
    const { id, createdAt, ...updateData } = data;
    const row = await this.transactionHost.tx.textToSpeech.upsert({
      where: { id },
      create: data,
      update: { ...updateData, createdAt },
    });
    return TextToSpeechMapper.toDomain(row);
  }

  async updateStatus(
    id: string,
    status: TTSStatus,
    errorMessage?: string,
  ): Promise<void> {
    await this.transactionHost.tx.textToSpeech.updateMany({
      where: { id },
      data: {
        status,
        updatedAt: new Date(),
        ...(errorMessage === undefined ? {} : { errorMessage }),
      },
    });
  }

  async deleteByChapterId(chapterId: string): Promise<void> {
    await this.transactionHost.tx.textToSpeech.deleteMany({
      where: { chapterId },
    });
  }
}
