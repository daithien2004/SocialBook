import { IsString } from 'class-validator';
import type { Actor } from '@/shared/casl/actor';
import { GetCurrentRoomChapterQuery } from '@/modules/reading-rooms/application/queries/get-current-room-chapter/get-current-room-chapter.query';

export class GetCurrentRoomChapterRequestDto {
  @IsString()
  code!: string;

  toQuery(actor: Actor): GetCurrentRoomChapterQuery {
    return new GetCurrentRoomChapterQuery(this.code, actor);
  }
}
