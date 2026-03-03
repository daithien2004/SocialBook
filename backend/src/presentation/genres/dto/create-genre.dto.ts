import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class CreateGenreDto {
    @IsString()
    @IsNotEmpty({ message: 'Tên thể loại không được để trống' })
    @MaxLength(100, { message: 'Tên thể loại không được vượt quá 100 ký tự' })
    name: string;

    @IsString()
    @IsOptional()
    @MaxLength(500, { message: 'Mô tả không được vượt quá 500 ký tự' })
    description?: string;
}
