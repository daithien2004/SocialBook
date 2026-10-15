import { ApiProperty } from '@nestjs/swagger';
import type { ToxicWordReadModel } from '@/modules/content-moderation/application/read-models/toxic-word.read-model';
import type { ToxicWordResult } from '@/modules/content-moderation/application/toxic-word.result';

export class ToxicWordResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  pattern!: string;

  @ApiProperty()
  group!: string;

  @ApiProperty()
  originalWord!: string;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  static fromReadModel(word: ToxicWordReadModel): ToxicWordResponseDto {
    const dto = new ToxicWordResponseDto();
    dto.id = word.id;
    dto.pattern = word.pattern;
    dto.group = word.group;
    dto.originalWord = word.originalWord;
    dto.createdAt = word.createdAt;
    dto.updatedAt = word.updatedAt;
    return dto;
  }

  static fromResult(word: ToxicWordResult): ToxicWordResponseDto {
    const dto = new ToxicWordResponseDto();
    dto.id = word.id;
    dto.pattern = word.pattern;
    dto.group = word.group;
    dto.originalWord = word.originalWord;
    dto.createdAt = word.createdAt;
    dto.updatedAt = word.updatedAt;
    return dto;
  }
}
