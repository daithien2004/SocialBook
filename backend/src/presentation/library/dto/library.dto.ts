import {
  IsEnum,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsArray,
} from 'class-validator';
import { ReadingStatus } from '@/domain/library/entities/reading-list.entity';

export class UpdateProgressDto {
  @IsMongoId()
  bookId: string;

  @IsMongoId()
  chapterId: string;

  @IsNumber()
  @IsOptional()
  progress?: number;
}

export class UpdateLibraryStatusDto {
  @IsMongoId()
  bookId: string;

  @IsEnum(ReadingStatus)
  status: ReadingStatus;
}

export class AddToCollectionsDto {
  @IsMongoId()
  bookId: string;

  @IsArray()
  @IsMongoId({ each: true })
  collectionIds: string[];
}

export class UpdateReadingTimeDto {
  @IsMongoId()
  bookId: string;

  @IsMongoId()
  chapterId: string;

  @IsNumber()
  durationInSeconds: number;
}

