import { IsOptional, IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddToxicWordDto {
  @ApiProperty({ description: 'Từ khóa hoặc Regex pattern' })
  @IsString()
  @IsNotEmpty()
  pattern!: string;

  @ApiProperty({ description: 'Nhóm từ (VD: thô tục mạnh, xúc phạm)' })
  @IsString()
  @IsNotEmpty()
  group!: string;

  @ApiPropertyOptional({ description: 'Từ gốc tương ứng với pattern' })
  @IsOptional()
  @IsString()
  originalWord?: string;
}
