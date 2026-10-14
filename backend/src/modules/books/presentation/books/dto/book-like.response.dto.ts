import { ApiProperty } from '@nestjs/swagger';

export class BookLikeResponseDto {
  @ApiProperty()
  slug: string;

  @ApiProperty()
  isLiked: boolean;

  @ApiProperty()
  likes: number;

  constructor(props: { slug: string; isLiked: boolean; likes: number }) {
    this.slug = props.slug;
    this.isLiked = props.isLiked;
    this.likes = props.likes;
  }
}
