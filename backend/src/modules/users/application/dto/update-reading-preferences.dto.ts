import { ApiProperty } from '@nestjs/swagger';
import {
    IsIn,
    IsNumber,
    IsOptional,
    IsString,
    Max,
    Min
} from 'class-validator';

export class UpdateReadingPreferencesDto {
    @ApiProperty({ example: 'light', enum: ['light', 'dark', 'sepia'], required: false })
    @IsOptional()
    @IsString()
    @IsIn(['light', 'dark', 'sepia'])
    theme?: string;

    @ApiProperty({ example: 16, minimum: 12, maximum: 32, required: false })
    @IsOptional()
    @IsNumber()
    @Min(12)
    @Max(32)
    fontSize?: number;

    @ApiProperty({ example: 'Arial', required: false })
    @IsOptional()
    @IsString()
    fontFamily?: string;

    @ApiProperty({ example: 1.5, minimum: 1.2, maximum: 2.5, required: false })
    @IsOptional()
    @IsNumber()
    @Min(1.2)
    @Max(2.5)
    lineHeight?: number;

    @ApiProperty({ example: 0, minimum: -2, maximum: 5, required: false })
    @IsOptional()
    @IsNumber()
    @Min(-2)
    @Max(5)
    letterSpacing?: number;

    @ApiProperty({ example: '#ffffff', required: false })
    @IsOptional()
    @IsString()
    backgroundColor?: string;

    @ApiProperty({ example: '#000000', required: false })
    @IsOptional()
    @IsString()
    textColor?: string;

    @ApiProperty({ example: 'left', enum: ['left', 'center', 'justify'], required: false })
    @IsOptional()
    @IsString()
    @IsIn(['left', 'center', 'justify'])
    textAlign?: string;

    @ApiProperty({ example: 10, minimum: 0, maximum: 100, required: false })
    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(100)
    marginWidth?: number;
}
