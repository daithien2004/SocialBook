import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { UserHighlightReadModel } from '../../application/user-highlight.read-model';

export class UserHighlightResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  bookId!: string;

  @ApiProperty()
  chapterId!: string;

  @ApiProperty()
  paragraphId!: string;

  @ApiProperty()
  content!: string;

  @ApiProperty()
  color!: string;

  @ApiPropertyOptional({ nullable: true })
  note!: string | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  static fromReadModel(
    model: UserHighlightReadModel,
  ): UserHighlightResponseDto {
    const response = new UserHighlightResponseDto();
    response.id = model.id;
    response.bookId = model.bookId;
    response.chapterId = model.chapterId;
    response.paragraphId = model.paragraphId;
    response.content = model.content;
    response.color = model.color;
    response.note = model.note;
    response.createdAt = model.createdAt;
    response.updatedAt = model.updatedAt;
    return response;
  }

  static fromReadModels(
    models: UserHighlightReadModel[],
  ): UserHighlightResponseDto[] {
    return models.map((model) => this.fromReadModel(model));
  }
}
