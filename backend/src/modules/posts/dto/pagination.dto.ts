import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsMongoId, IsOptional, Min } from 'class-validator';
import { Types } from 'mongoose';

export class PaginationDto {
  @ApiProperty({ example: 1, required: false, default: 1 })
  @IsOptional()
  @Type(() => Number) // Tương đương ParseIntPipe: ép kiểu từ string query sang number
  @IsInt() // Validate phải là số nguyên
  @Min(1) // Validate số trang tối thiểu là 1
  page: number = 1; // Tương đương DefaultValuePipe(1)

  @ApiProperty({ example: 10, required: false, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit: number = 10; // Tương đương DefaultValuePipe(10)
}

export class PaginationUserDto {
  @ApiProperty({ example: 1, required: false, default: 1 })
  @IsOptional()
  @Type(() => Number) // Tương đương ParseIntPipe: ép kiểu từ string query sang number
  @IsInt() // Validate phải là số nguyên
  @Min(1) // Validate số trang tối thiểu là 1
  page: number = 1; // Tương đương DefaultValuePipe(1)

  @ApiProperty({ example: 10, required: false, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit: number = 10; // Tương đương DefaultValuePipe(10)

  @ApiProperty({ example: '64a7f...', required: true })
  @IsOptional()
  @IsMongoId()
  @Type(() => Types.ObjectId)
  userId: string;
}
