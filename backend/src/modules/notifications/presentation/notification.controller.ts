import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import type { Actor } from '@/shared/casl/actor';
import type { PaginatedResult } from '@/shared/domain/pagination.types';
import { paginate } from '@/shared/domain/pagination.types';
import { CheckPolicy } from '@/shared/casl/check-policy.decorator';
import { PoliciesGuard } from '@/shared/casl/policies.guard';
import { CurrentActor } from '@/shared/platform/decorators/current-actor.decorator';
import { Roles } from '@/shared/platform/decorators/roles.decorator';
import { RolesGuard } from '@/shared/platform/guards/roles.guard';
import {
  ApiPaginatedResponse,
  ApiProblemResponses,
} from '@/shared/platform/decorators/api-response.decorators';
import { MarkAllNotificationsReadCommand } from '@/modules/notifications/application/commands/mark-notification/mark-all-notifications-read.command';
import { MarkNotificationReadCommand } from '@/modules/notifications/application/commands/mark-notification/mark-notification-read.command';
import { CreateNotificationDto } from '@/modules/notifications/presentation/dto/create-notification.dto';
import { FilterNotificationDto } from '@/modules/notifications/presentation/dto/filter-notification.dto';
import { NotificationResponseDto } from '@/modules/notifications/presentation/dto/notification.response.dto';
import { GetNotificationByIdQuery } from '@/modules/notifications/application/queries/get-notification-by-id/get-notification-by-id.query';
import { NotFoundDomainException } from '@/shared/domain/common-exceptions';

@ApiProblemResponses()
@ApiTags('Notifications')
@UseGuards(PoliciesGuard)
@Controller('notifications')
export class NotificationController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @ApiOperation({ summary: "Get current user's notifications" })
  @CheckPolicy('read', 'Notification')
  @ApiPaginatedResponse(NotificationResponseDto, 'offset')
  @Get()
  async getMyNotifications(
    @CurrentActor() actor: Actor,
    @Query() filter: FilterNotificationDto,
  ): Promise<PaginatedResult<NotificationResponseDto>> {
    const page = await this.queryBus.execute(filter.toQuery(actor));
    return paginate(page.items, page.total, filter, (items) =>
      NotificationResponseDto.fromArray(items),
    );
  }

  @ApiOperation({ summary: 'Mark all notifications as read' })
  @CheckPolicy('update', 'Notification')
  @ApiNoContentResponse()
  @Patch('read-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  async markAllRead(@CurrentActor() actor: Actor): Promise<void> {
    await this.commandBus.execute(new MarkAllNotificationsReadCommand(actor));
  }

  @ApiOperation({ summary: 'Mark a notification as read' })
  @CheckPolicy('update', 'Notification')
  @ApiNoContentResponse()
  @Patch(':id/read')
  @HttpCode(HttpStatus.NO_CONTENT)
  async markRead(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentActor() actor: Actor,
  ): Promise<void> {
    await this.commandBus.execute(new MarkNotificationReadCommand(actor, id));
  }

  @ApiOperation({ summary: 'Create a notification' })
  @CheckPolicy('create', 'Notification')
  @ApiCreatedResponse({ type: NotificationResponseDto })
  @Post()
  @Roles('admin')
  @UseGuards(RolesGuard)
  async create(
    @CurrentActor() actor: Actor,
    @Body() dto: CreateNotificationDto,
  ): Promise<NotificationResponseDto> {
    const id = await this.commandBus.execute(dto.toCommand(actor));
    const result = await this.queryBus.execute(
      new GetNotificationByIdQuery(actor, id),
    );
    if (!result) {
      throw new NotFoundDomainException('NOTIFICATION_NOT_FOUND');
    }
    return NotificationResponseDto.fromResult(result);
  }
}
