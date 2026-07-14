import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ToxicWordDocument } from '@/infrastructure/database/schemas/toxic-word.schema';

@Injectable()
export class ToxicWordsSeed {
  private readonly logger = new Logger(ToxicWordsSeed.name);

  constructor(
    @InjectModel(ToxicWordDocument.name)
    private readonly toxicWordModel: Model<ToxicWordDocument>,
  ) {}

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

    for (const word of defaultToxicWords) {
      const existed = await this.toxicWordModel
        .findOne({ pattern: word.pattern })
        .lean();
      if (existed) {
        this.logger.log(`Toxic word exists: ${word.pattern}`);
        continue;
      }

      await this.toxicWordModel.create(word);
      this.logger.log(`Toxic word created: ${word.pattern}`);
    }
  }
}
