import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
  ArrayMinSize,
  IsUUID,
  IsNumber,
} from 'class-validator';
import type { Actor } from '@/shared/casl/actor';
import { UpdateChapterCommand } from '@/modules/chapters/application/chapters/commands/update-chapter/update-chapter.command';

class ParagraphDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  @IsNotEmpty({ message: 'Nội dung đoạn văn không được để trống' })
  content!: string;
}

export class UpdateChapterDto {
  @IsOptional()
  @IsString()
  @MinLength(3, { message: 'Tiêu đề phải có ít nhất 3 ký tự' })
  title?: string;

  @IsOptional()
  @IsUUID('4', { message: 'Book ID không hợp lệ' })
  bookId?: string;

  @IsOptional()
  @IsArray({ message: 'Paragraphs phải là mảng' })
  @ArrayMinSize(1, { message: 'Chương phải có ít nhất 1 đoạn văn' })
  @ValidateNested({ each: true })
  @Type(() => ParagraphDto)
  paragraphs?: ParagraphDto[];

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsNumber()
  orderIndex?: number;

  toCommand(actor: Actor, id: string): UpdateChapterCommand {
    return new UpdateChapterCommand({
      actor,
      id,
      title: this.title,
      bookId: this.bookId,
      paragraphs: this.paragraphs?.map((paragraph) => ({
        id: paragraph.id,
        content: paragraph.content,
      })),
      slug: this.slug,
      orderIndex: this.orderIndex,
    });
  }
}
