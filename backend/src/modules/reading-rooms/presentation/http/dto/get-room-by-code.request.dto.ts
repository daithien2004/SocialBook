import { IsString } from 'class-validator';
import type { Actor } from '@/shared/casl/actor';
import { GetRoomByCodeQuery } from '@/modules/reading-rooms/application/queries/get-room-by-code/get-room-by-code.query';

export class GetRoomByCodeRequestDto {
  @IsString()
  code!: string;

  toQuery(actor: Actor): GetRoomByCodeQuery {
    return new GetRoomByCodeQuery(this.code, actor);
  }
}
