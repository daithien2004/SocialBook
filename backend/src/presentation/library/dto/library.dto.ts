import { ReadingStatus } from '@/domain/library/entities/reading-list.entity';
import {
  IsArray,
  IsEnum,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

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
  @IsString({ each: true })
  @IsMongoId({ each: true, message: 'Each value in collectionIds must be a valid 24-character hexadecimal MongoDB ID' })
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

