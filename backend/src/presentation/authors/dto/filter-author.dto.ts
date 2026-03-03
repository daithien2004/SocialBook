import { IsOptional, IsString } from 'class-validator';

export class FilterAuthorDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    bio?: string;

    @IsOptional()
    isActive?: boolean;
}
