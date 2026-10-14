import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsUUID,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';
import type { MediaUploadFile } from '@/modules/media/domain/public-api';
import { UpdateBookCommand } from '@/modules/books/application/books/commands/update-book/update-book.command';
import type { Actor } from '@/shared/casl/actor';

export class UpdateBookDto {
  @IsOptional()
  @Length(5, 200, { message: 'Tiêu đề phải từ 5 đến 200 ký tự' })
  @IsString()
  title?: string;

  @IsOptional()
  @IsUUID('4', { message: 'Author ID không hợp lệ' })
  authorId?: string;

  @Transform(({ value }: { value: unknown }) => {
    if (!value || (typeof value === 'string' && value.trim() === ''))
      return undefined;
    if (Array.isArray(value)) return value.map((item: unknown) => item);
    if (typeof value === 'string') return [value.trim()];
    return undefined;
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1, { message: 'Phải chọn ít nhất 1 thể loại' })
  @ArrayMaxSize(5, { message: 'Tối đa 5 thể loại' })
  @IsUUID('4', { each: true, message: 'Mỗi genre ID phải là UUID hợp lệ' })
  genres?: string[];

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  publishedYear?: string;

  @IsOptional()
  @IsEnum(['draft', 'published', 'completed'], {
    message: 'Status phải là draft, published hoặc completed',
  })
  status?: 'draft' | 'published' | 'completed';

  @Transform(({ value }: { value: unknown }) => {
    if (!value || (typeof value === 'string' && value.trim() === ''))
      return undefined;
    if (Array.isArray(value)) return value.map((item: unknown) => item);
    if (typeof value === 'string') {
      return value.includes(',')
        ? value.split(',').map((s) => s.trim())
        : [value.trim()];
    }
    return undefined;
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  coverUrl?: string;

  toCommand(
    actor: Actor,
    id: string,
    coverFile?: MediaUploadFile,
  ): UpdateBookCommand {
    return new UpdateBookCommand({
      actor,
      id,
      title: this.title,
      authorId: this.authorId,
      genres: this.genres,
      description: this.description,
      publishedYear: this.publishedYear,
      coverUrl: this.coverUrl,
      coverFile,
      status: this.status,
      tags: this.tags,
    });
  }
}
