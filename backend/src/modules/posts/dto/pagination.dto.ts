import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';

export class PaginationDto {
  @IsOptional()
  @Type(() => Number) // Tương đương ParseIntPipe: ép kiểu từ string query sang number
  @IsInt() // Validate phải là số nguyên
  @Min(1) // Validate số trang tối thiểu là 1
  page: number = 1; // Tương đương DefaultValuePipe(1)

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit: number = 10; // Tương đương DefaultValuePipe(10)
}
