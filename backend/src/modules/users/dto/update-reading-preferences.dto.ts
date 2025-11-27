import {
    IsString,
    IsNumber,
    IsOptional,
    IsIn,
    Min,
    Max,
    IsHexColor,
} from 'class-validator';

export class UpdateReadingPreferencesDto {
    @IsOptional()
    @IsString()
    @IsIn(['light', 'dark', 'sepia'])
    theme?: string;

    @IsOptional()
    @IsNumber()
    @Min(12)
    @Max(32)
    fontSize?: number;

    @IsOptional()
    @IsString()
    fontFamily?: string;

    @IsOptional()
    @IsNumber()
    @Min(1.2)
    @Max(2.5)
    lineHeight?: number;

    @IsOptional()
    @IsNumber()
    @Min(-2)
    @Max(5)
    letterSpacing?: number;

    @IsOptional()
    @IsString()
    backgroundColor?: string;

    @IsOptional()
    @IsString()
    textColor?: string;

    @IsOptional()
    @IsString()
    @IsIn(['left', 'center', 'justify'])
    textAlign?: string;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(100)
    marginWidth?: number;
}
