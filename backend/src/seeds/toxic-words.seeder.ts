import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '@/core/database/postgres/prisma.service';

@Injectable()
export class ToxicWordsSeed {
  private readonly logger = new Logger(ToxicWordsSeed.name);

  constructor(private readonly prisma: PrismaService) {}

  async run() {
    const defaultToxicWords = [
      { pattern: 'đ[ịi]t\\s*m', group: 'thô tục mạnh', originalWord: 'địt m' },
      {
        pattern: '(?<![a-zA-ZÀ-ỹ])l[ồổõọ]n(?![a-zA-ZÀ-ỹg])',
        group: 'thô tục mạnh',
        originalWord: 'lồn',
      },
      {
        pattern: '(?<![a-zA-ZÀ-ỹ])c[ặa]c(?![a-zA-ZÀ-ỹh])',
        group: 'thô tục mạnh',
        originalWord: 'cặc',
      },
      { pattern: 'b[uù]ồ[iĩ]', group: 'thô tục mạnh', originalWord: 'buồi' },
      {
        pattern: '(?<![a-zA-ZÀ-ỹ])c[ứư]t(?![a-zA-ZÀ-ỹ])',
        group: 'thô tục nhẹ',
        originalWord: 'cứt',
      },
      {
        pattern: 'đ[ỹĩỉi]\\s*đ[iỉĩỹ]',
        group: 'xúc phạm',
        originalWord: 'đĩ điếm',
      },
      {
        pattern: 'đ[iĩỉỹ]\\s*m[eẹ]',
        group: 'thô tục mạnh',
        originalWord: 'đĩ mẹ',
      },
      {
        pattern: '(?<![a-zA-ZÀ-ỹ])ph[òóõỏọ](?![a-zA-ZÀ-ỹng])',
        group: 'xúc phạm',
        originalWord: 'phò',
      },
      { pattern: 'đ\\s*m', group: 'thô tục nhẹ', originalWord: 'đm' },
      { pattern: 'v[aãả]i\\s*l', group: 'thô tục nhẹ', originalWord: 'vãi l' },
    ];

    const result = await this.prisma.toxicWord.createMany({
      data: defaultToxicWords.map((word) => ({ id: randomUUID(), ...word })),
      skipDuplicates: true,
    });
    this.logger.log(`Created ${String(result.count)} default toxic words`);
  }

  async clear(): Promise<void> {
    await this.prisma.toxicWord.deleteMany();
  }
}
