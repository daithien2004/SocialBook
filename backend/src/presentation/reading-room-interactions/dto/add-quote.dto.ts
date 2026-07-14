import { IsString, IsNotEmpty } from 'class-validator';

export class AddQuoteDto {
  @IsString()
  @IsNotEmpty()
  roomId: string;

  @IsString()
  @IsNotEmpty()
  chapterSlug: string;

  @IsString()
  @IsNotEmpty()
  paragraphId: string;

  @IsString()
  @IsNotEmpty()
  content: string;
}
