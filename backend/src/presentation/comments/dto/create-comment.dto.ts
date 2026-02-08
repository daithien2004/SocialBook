import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsMongoId, IsNotEmpty, IsOptional, IsString, ValidateIf, IsNumber } from 'class-validator';

export enum TargetTypeEnum {
    BOOK = 'book',
    CHAPTER = 'chapter',
    POST = 'post',
    AUTHOR = 'author'
}

export class CreateCommentDto {
    @ApiProperty({ enum: TargetTypeEnum, description: 'Target type' })
    @IsEnum(TargetTypeEnum)
    targetType: TargetTypeEnum;

    @ApiProperty({ description: 'Target ID' })
    @IsMongoId()
    targetId: string;

    @ApiProperty({ description: 'Comment content' })
    @IsString()
    @IsNotEmpty()
    content: string;

    @ApiProperty({ description: 'Parent comment ID', required: false })
    @IsOptional()
    @ValidateIf((o) => o.parentId !== null)
    @IsMongoId()
    parentId?: string | null;
}

export class UpdateCommentDto {
    @ApiProperty({ description: 'Updated comment content' })
    @IsString()
    @IsNotEmpty()
    content: string;
}

export class CommentCountDto {
    @ApiProperty({ description: 'Target ID' })
    @IsMongoId()
    targetId: string;

    @ApiProperty({ enum: TargetTypeEnum, description: 'Target type' })
    @IsEnum(TargetTypeEnum)
    targetType: TargetTypeEnum;
}

export class ModerateCommentDto {
    @ApiProperty({ enum: ['approved', 'rejected'], description: 'Moderation status' })
    @IsEnum(['approved', 'rejected'])
    status: 'approved' | 'rejected';

    @ApiProperty({ description: 'Moderation reason', required: false })
    @IsOptional()
    @IsString()
    reason?: string;
}

export class FlagCommentDto {
    @ApiProperty({ description: 'Flag reason' })
    @IsString()
    @IsNotEmpty()
    reason: string;
}
