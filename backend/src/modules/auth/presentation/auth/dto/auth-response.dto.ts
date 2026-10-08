import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProfileResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty()
  role!: string;
}

export class MeResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty()
  role!: string;

  @ApiProperty()
  username!: string;

  @ApiPropertyOptional()
  image?: string;
}

export class AccessTokenResponseDto {
  @ApiProperty()
  accessToken!: string;
}

export class WsTicketResponseDto {
  @ApiProperty()
  ticket!: string;
}

export class ResendOtpResponseDto {
  @ApiProperty()
  resendCooldown!: number;
}
