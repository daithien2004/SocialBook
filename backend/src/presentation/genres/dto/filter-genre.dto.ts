import { IsOptional, IsString } from 'class-validator';

export class FilterGenreDto {
    @IsOptional()
    @IsString()
    name?: string;
}
