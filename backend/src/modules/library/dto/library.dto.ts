// src/modules/library/dto/library.dto.ts
import {
  IsEnum,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  IsArray,
} from 'class-validator';
import { ReadingStatus } from '../schemas/reading-list.schema';

// 1. Update tiến độ đọc (Khi user scroll hoặc next chap)
export class UpdateProgressDto {
  @IsMongoId()
  bookId: string;

  @IsMongoId()
  chapterId: string;

  @IsNumber()
  @IsOptional()
  progress?: number; // Vị trí scroll hoặc %
}

// 2. Thêm sách vào thư viện hoặc đổi trạng thái (Archive/Reading...)
export class UpdateLibraryStatusDto {
  @IsMongoId()
  bookId: string;

  @IsEnum(ReadingStatus)
  status: ReadingStatus;
}

// 3. Thêm sách vào danh sách Folder cá nhân
export class AddToCollectionsDto {
  @IsMongoId()
  bookId: string;

  @IsArray()
  @IsMongoId({ each: true })
  collectionIds: string[]; // Mảng ID của các folder muốn thêm vào
}
