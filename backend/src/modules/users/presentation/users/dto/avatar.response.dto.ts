import { ApiProperty } from '@nestjs/swagger';

export class AvatarResponseDto {
  @ApiProperty({ format: 'uri' })
  url!: string;

  static fromResult(result: { url: string }): AvatarResponseDto {
    const response = new AvatarResponseDto();
    response.url = result.url;
    return response;
  }
}
