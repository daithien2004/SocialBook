// src/chapters/dto/create-chapter.dto.ts
import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';

class ParagraphDto {
  @IsString()
  @IsNotEmpty({ message: 'ID đoạn văn không được để trống' })
  id: string;

  @IsString()
  @IsNotEmpty({ message: 'Nội dung đoạn văn không được để trống' })
  content: string;
}

export class CreateChapterDto {
  @IsString()
  @IsNotEmpty({ message: 'Tiêu đề chương là bắt buộc' })
  @MinLength(3, { message: 'Tiêu đề phải có ít nhất 3 ký tự' })
  title: string;

  @IsArray({ message: 'Paragraphs phải là mảng' })
  @ArrayMinSize(1, { message: 'Chương phải có ít nhất 1 đoạn văn' })
  @ValidateNested({ each: true })
  @Type(() => ParagraphDto)
  paragraphs: ParagraphDto[];

  @IsOptional()
  @IsString()
  slug?: string;
}