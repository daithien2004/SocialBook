import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/core/database/postgres/prisma.service';
import { ITextToSpeechRepository } from '@/modules/text-to-speech/domain/repositories/text-to-speech.repository.interface';
import {
  TextToSpeech,
  TTSStatus,
} from '@/modules/text-to-speech/domain/entities/text-to-speech.entity';
import { TextToSpeechMapper } from './text-to-speech.mapper';

@Injectable()
export class TextToSpeechRepository implements ITextToSpeechRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<TextToSpeech | null> {
    const row = await this.prisma.textToSpeech.findUnique({ where: { id } });
    return row ? TextToSpeechMapper.toDomain(row) : null;
  }

  async findByChapterId(chapterId: string): Promise<TextToSpeech | null> {
    const row = await this.prisma.textToSpeech.findFirst({
      where: { chapterId },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });
    return row ? TextToSpeechMapper.toDomain(row) : null;
  }

  async findCompletedByChapterId(
    chapterId: string,
  ): Promise<TextToSpeech | null> {
    const row = await this.prisma.textToSpeech.findFirst({
      where: { chapterId, status: TTSStatus.COMPLETED },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });
    return row ? TextToSpeechMapper.toDomain(row) : null;
  }

  async findExisting(
    chapterId: string,
    language: string,
    voice: string,
  ): Promise<TextToSpeech | null> {
    const row = await this.prisma.textToSpeech.findFirst({
      where: { chapterId, status: TTSStatus.COMPLETED, language, voice },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });
    return row ? TextToSpeechMapper.toDomain(row) : null;
  }

  async save(entity: TextToSpeech): Promise<TextToSpeech> {
    const data = TextToSpeechMapper.toCreateInput(entity);
    const { id, createdAt, ...updateData } = data;
    const row = await this.prisma.textToSpeech.upsert({
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
    await this.prisma.textToSpeech.updateMany({
      where: { id },
      data: {
        status,
        updatedAt: new Date(),
        ...(errorMessage === undefined ? {} : { errorMessage }),
      },
    });
  }

  async deleteByChapterId(chapterId: string): Promise<void> {
    await this.prisma.textToSpeech.deleteMany({ where: { chapterId } });
  }
}
