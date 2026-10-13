import { ReadingStatus } from '@/modules/library/domain/library/entities/reading-list.entity';
import {
  IsArray,
  IsEnum,
  IsUUID,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class UpdateProgressDto {
  @IsUUID('4')
  bookId!: string;

  @IsUUID('4')
  chapterId!: string;

  @IsNumber()
  @IsOptional()
  progress?: number;
}

export class UpdateLibraryStatusDto {
  @IsUUID('4')
  bookId!: string;

  @IsEnum(ReadingStatus)
  status!: ReadingStatus;
}

export class AddToCollectionsDto {
  @IsUUID('4')
  bookId!: string;

  @IsArray()
  @IsString({ each: true })
  @IsUUID('4', {
    each: true,
    message: 'Each value in collectionIds must be a valid UUID',
  })
  collectionIds!: string[];
}

export class UpdateReadingTimeDto {
  @IsUUID('4')
  bookId!: string;

  @IsUUID('4')
  chapterId!: string;

  @IsNumber()
  durationInSeconds!: number;
}
