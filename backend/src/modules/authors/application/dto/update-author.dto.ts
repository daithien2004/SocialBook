import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateAuthorDto {
    @IsOptional()
    @IsString()
    @MaxLength(100, { message: 'Tên tác giả không được vượt quá 100 ký tự' })
    name?: string;

    @IsOptional()
    @IsString()
    @MaxLength(500, { message: 'Tiểu sử không được vượt quá 500 ký tự' })
    bio?: string;

    @IsOptional()
    @IsString()
    photoUrl?: string;
}
