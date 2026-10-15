import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProfileResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty()
  role!: string;

  static fromValues(
    id: string,
    email: string,
    role: string,
  ): ProfileResponseDto {
    const response = new ProfileResponseDto();
    response.id = id;
    response.email = email;
    response.role = role;
    return response;
  }
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

  static fromValues(values: {
    id: string;
    email: string;
    role: string;
    username: string;
    image?: string;
  }): MeResponseDto {
    const response = new MeResponseDto();
    response.id = values.id;
    response.email = values.email;
    response.role = values.role;
    response.username = values.username;
    response.image = values.image;
    return response;
  }
}

export class AccessTokenResponseDto {
  @ApiProperty()
  accessToken!: string;

  static fromToken(accessToken: string): AccessTokenResponseDto {
    const response = new AccessTokenResponseDto();
    response.accessToken = accessToken;
    return response;
  }
}

export class WsTicketResponseDto {
  @ApiProperty()
  ticket!: string;

  static fromTicket(ticket: string): WsTicketResponseDto {
    const response = new WsTicketResponseDto();
    response.ticket = ticket;
    return response;
  }
}

export class ResendOtpResponseDto {
  @ApiProperty()
  resendCooldown!: number;

  static fromCooldown(resendCooldown: number): ResendOtpResponseDto {
    const response = new ResendOtpResponseDto();
    response.resendCooldown = resendCooldown;
    return response;
  }
}
