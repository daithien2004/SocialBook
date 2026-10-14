import { ApiProperty } from '@nestjs/swagger';

export class CreateRoomResponseDto {
  @ApiProperty()
  roomId!: string;

  constructor(roomId: string) {
    this.roomId = roomId;
  }
}
