import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty, IsOptional, IsBoolean, IsString } from 'class-validator';

export class CreateFollowDto {
    @ApiProperty({ description: 'Target user ID to follow' })
    @IsMongoId()
    @IsNotEmpty()
    targetId: string;

    @ApiProperty({ description: 'Follow status', default: true })
    @IsOptional()
    @IsBoolean()
    status?: boolean;
}

export class UpdateFollowDto {
    @ApiProperty({ description: 'Follow status' })
    @IsBoolean()
    @IsNotEmpty()
    status: boolean;
}

export class FollowStatusDto {
    @ApiProperty({ description: 'User ID' })
    @IsMongoId()
    @IsNotEmpty()
    userId: string;

    @ApiProperty({ description: 'Target user ID' })
    @IsMongoId()
    @IsNotEmpty()
    targetId: string;
}

export class FollowStatsDto {
    @ApiProperty({ description: 'User ID' })
    @IsMongoId()
    @IsNotEmpty()
    userId: string;
}

export class FilterFollowDto {
    @ApiProperty({ description: 'User ID filter', required: false })
    @IsOptional()
    @IsMongoId()
    userId?: string;

    @ApiProperty({ description: 'Target ID filter', required: false })
    @IsOptional()
    @IsMongoId()
    targetId?: string;

    @ApiProperty({ description: 'Status filter', required: false })
    @IsOptional()
    @IsBoolean()
    status?: boolean;

    @ApiProperty({ description: 'Date from filter', required: false })
    @IsOptional()
    @IsString()
    dateFrom?: string;

    @ApiProperty({ description: 'Date to filter', required: false })
    @IsOptional()
    @IsString()
    dateTo?: string;
}
