import { IsString, IsOptional, MaxLength } from 'class-validator';

export class UpdateGenreDto {
    @IsString()
    @IsOptional()
    @MaxLength(20, { message: 'Tên thể loại không được vượt quá 20 ký tự' })
    name?: string;

    @IsString()
    @IsOptional()
    @MaxLength(500, { message: 'Mô tả không được vượt quá 500 ký tự' })
    description?: string;
}
