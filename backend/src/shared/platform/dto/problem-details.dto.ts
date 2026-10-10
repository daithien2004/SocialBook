import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProblemFieldErrorDto {
  @ApiProperty()
  field!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty()
  message!: string;
}

export class ProblemDetailsDto {
  @ApiProperty({
    type: String,
    enum: ['about:blank'],
    example: 'about:blank',
  })
  type = 'about:blank' as const;

  @ApiProperty({ example: 'Not Found' })
  title!: string;

  @ApiProperty({ example: 404 })
  status!: number;

  @ApiProperty({ example: 'POST_NOT_FOUND' })
  code!: string;

  @ApiProperty({ example: 'Post not found' })
  detail!: string;

  @ApiProperty({ example: '9f3c1a...' })
  traceId!: string;

  @ApiPropertyOptional({ type: [ProblemFieldErrorDto] })
  errors?: ProblemFieldErrorDto[];
}
