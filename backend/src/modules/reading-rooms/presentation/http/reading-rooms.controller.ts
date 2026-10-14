import { CommandBus, QueryBus } from '@nestjs/cqrs';

import {
  applyDecorators,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

import type { ChapterDetailReadModel } from '@/modules/chapters';

import { CurrentActor } from '@/shared/platform/decorators/current-actor.decorator';
import { IdempotencyKey } from '@/shared/platform/decorators/idempotency-key.decorator';
import {
  paginate,
  type PaginatedResult,
} from '@/shared/domain/pagination.types';

import { CreateRoomRequestDto } from './dto/create-room.request.dto';
import { CreateRoomResponseDto } from './dto/create-room.response.dto';
import { GetCurrentRoomChapterRequestDto } from './dto/get-current-room-chapter.request.dto';
import { GetMyActiveRoomsRequestDto } from './dto/get-my-active-rooms.request.dto';
import { GetMyHistoryRequestDto } from './dto/get-my-history.request.dto';
import { GetRoomByCodeRequestDto } from './dto/get-room-by-code.request.dto';
import { GetRoomHighlightsRequestDto } from './dto/get-room-highlights.request.dto';
import { ReactivateRoomRequestDto } from './dto/reactivate-room.request.dto';
import {
  ReadingRoomHighlightResponseDto,
  ReadingRoomPreviewResponseDto,
  ReadingRoomResponseDto,
  toReadingRoomResponseDto,
} from './dto/reading-room.response.dto';
import { CurrentRoomChapterResponseDto } from './dto/current-room-chapter.response.dto';
import {
  ApiPaginatedResponse,
  ApiProblemResponses,
} from '@/shared/platform/decorators/api-response.decorators';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiExtraModels,
  ApiNoContentResponse,
  ApiOperation,
  ApiOkResponse,
  ApiTags,
  ApiExtension,
  getSchemaPath,
} from '@nestjs/swagger';
import { CheckPolicy } from '@/shared/casl/check-policy.decorator';
import type { AppAction } from '@/shared/casl/app-ability';
import { PoliciesGuard } from '@/shared/casl/policies.guard';
import type { Actor } from '@/shared/casl/actor';

const CheckReadingRoomPolicy = (action: AppAction) =>
  applyDecorators(
    CheckPolicy(action, 'ReadingRoom'),
    ApiExtension('x-policy', { action, subject: 'ReadingRoom' }),
  );

@ApiTags('Reading Rooms')
@ApiBearerAuth()
@ApiProblemResponses([400, 401, 403, 500])
@UseGuards(PoliciesGuard)
@Controller('reading-rooms')
export class ReadingRoomsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Throttle({ global: { limit: 10, ttl: 60000 } })
  @CheckReadingRoomPolicy('create')
  @Post()
  @ApiOperation({
    summary: 'Create a reading room',
    description:
      'Creates a room for the selected book and chapter. Reuse the same Idempotency-Key when retrying the same request.',
  })
  @ApiProblemResponses([404, 409, 429])
  @ApiCreatedResponse({ type: CreateRoomResponseDto })
  async createRoom(
    @CurrentActor() actor: Actor,
    @Body() dto: CreateRoomRequestDto,
    @IdempotencyKey({ required: true }) idempotencyKey: string,
  ): Promise<CreateRoomResponseDto> {
    const roomId = await this.commandBus.execute<string>(
      dto.toCommand(actor, idempotencyKey),
    );
    return new CreateRoomResponseDto(roomId);
  }

  @Get('my-active')
  @CheckReadingRoomPolicy('read')
  @ApiOperation({ summary: 'List the current actor’s active reading rooms' })
  @ApiPaginatedResponse(ReadingRoomResponseDto, 'offset')
  async getMyActiveRooms(
    @CurrentActor() actor: Actor,
    @Query() dto: GetMyActiveRoomsRequestDto,
  ): Promise<PaginatedResult<ReadingRoomResponseDto>> {
    const { items, total } = await this.queryBus.execute(dto.toQuery(actor));
    return paginate(items, total, dto, (rooms) =>
      ReadingRoomResponseDto.fromArray(rooms),
    );
  }

  @Get('my-history')
  @CheckReadingRoomPolicy('read')
  @ApiOperation({ summary: 'List the current actor’s reading room history' })
  @ApiPaginatedResponse(ReadingRoomResponseDto, 'offset')
  async getMyHistory(
    @CurrentActor() actor: Actor,
    @Query() dto: GetMyHistoryRequestDto,
  ): Promise<PaginatedResult<ReadingRoomResponseDto>> {
    const { items, total } = await this.queryBus.execute(dto.toQuery(actor));
    return paginate(items, total, dto, (rooms) =>
      ReadingRoomResponseDto.fromArray(rooms),
    );
  }

  @Patch(':code/reactivate')
  @HttpCode(HttpStatus.NO_CONTENT)
  @CheckReadingRoomPolicy('update')
  @ApiOperation({ summary: 'Reactivate a reading room' })
  @ApiProblemResponses([404, 409])
  @ApiNoContentResponse()
  async reactivateRoom(
    @CurrentActor() actor: Actor,
    @Param() dto: ReactivateRoomRequestDto,
  ): Promise<void> {
    await this.commandBus.execute(dto.toCommand(actor));
  }

  @Throttle({ global: { limit: 20, ttl: 60_000 } })
  @Get(':code/highlights')
  @CheckReadingRoomPolicy('read')
  @ApiOperation({ summary: 'List highlights in a reading room' })
  @ApiProblemResponses([404, 429])
  @ApiPaginatedResponse(ReadingRoomHighlightResponseDto, 'offset')
  async getRoomHighlights(
    @CurrentActor() actor: Actor,
    @Param('code') code: string,
    @Query() dto: GetRoomHighlightsRequestDto,
  ): Promise<PaginatedResult<ReadingRoomHighlightResponseDto>> {
    const page = await this.queryBus.execute(dto.toQuery(actor, code));
    return paginate(page.items, page.total, dto, (highlights) =>
      ReadingRoomHighlightResponseDto.fromArray(highlights),
    );
  }

  @Get(':code/current-chapter')
  @CheckReadingRoomPolicy('read')
  @ApiOperation({
    summary: 'Get the current chapter of a reading room',
    description: 'Available to active members of the room.',
  })
  @ApiProblemResponses([404])
  @ApiOkResponse({ type: CurrentRoomChapterResponseDto })
  async getCurrentRoomChapter(
    @CurrentActor() actor: Actor,
    @Param() dto: GetCurrentRoomChapterRequestDto,
  ): Promise<CurrentRoomChapterResponseDto> {
    const result = await this.queryBus.execute<ChapterDetailReadModel>(
      dto.toQuery(actor),
    );
    return CurrentRoomChapterResponseDto.fromReadModel(result);
  }

  @Throttle({ global: { limit: 20, ttl: 60_000 } })
  @Get(':code')
  @CheckReadingRoomPolicy('read')
  @ApiOperation({
    summary: 'Get a reading room',
    description:
      'Active members receive full room details. Other authorized users receive a preview.',
  })
  @ApiProblemResponses([404, 429])
  @ApiExtraModels(ReadingRoomResponseDto, ReadingRoomPreviewResponseDto)
  @ApiOkResponse({
    schema: {
      oneOf: [
        { $ref: getSchemaPath(ReadingRoomResponseDto) },
        { $ref: getSchemaPath(ReadingRoomPreviewResponseDto) },
      ],
    },
  })
  async getRoom(
    @CurrentActor() actor: Actor,
    @Param() dto: GetRoomByCodeRequestDto,
  ): Promise<ReadingRoomResponseDto | ReadingRoomPreviewResponseDto> {
    const result = await this.queryBus.execute(dto.toQuery(actor));
    return toReadingRoomResponseDto(result);
  }
}
