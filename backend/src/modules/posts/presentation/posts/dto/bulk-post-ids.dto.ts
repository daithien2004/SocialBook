import { ArrayNotEmpty, IsArray, IsUUID } from 'class-validator';

export class BulkPostIdsDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  postIds!: string[];
}
