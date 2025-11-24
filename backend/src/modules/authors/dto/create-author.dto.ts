import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateAuthorDto {
    @IsNotEmpty({ message: 'Tên tác giả không được để trống' })
    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    bio?: string;

    @IsOptional()
    @IsString()
    photoUrl?: string;
}
