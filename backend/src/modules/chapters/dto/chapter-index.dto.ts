import { ApiProperty } from '@nestjs/swagger';

export class ChapterIndexDto {
    @ApiProperty()
    _id: string;

    @ApiProperty()
    orderIndex: number;

    @ApiProperty()
    title: string;
}
