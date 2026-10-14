import { ApiTags } from '@nestjs/swagger';
import { buildPaginationMeta } from '@/shared/domain/pagination.types';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
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
  ParseUUIDPipe,
} from '@nestjs/common';

import { Roles } from '@/shared/platform/decorators/roles.decorator';
import { RolesGuard } from '@/shared/platform/guards/roles.guard';
import { CurrentUser } from '@/shared/platform/decorators/current-user.decorator';

import { CreateNotificationCommand } from '@/modules/notifications/application/commands/create-notification/create-notification.command';
import { GetUserNotificationsQuery } from '@/modules/notifications/application/queries/get-user-notification/get-user-notifications.query';
import { MarkNotificationReadCommand } from '@/modules/notifications/application/commands/mark-notification/mark-notification-read.command';
import { MarkAllNotificationsReadCommand } from '@/modules/notifications/application/commands/mark-notification/mark-all-notifications-read.command';
import { CreateNotificationDto } from '@/modules/notifications/presentation/dto/create-notification.dto';

import { FilterNotificationDto } from '@/modules/notifications/presentation/dto/filter-notification.dto';
import { NotificationResponseDto } from '@/modules/notifications/presentation/dto/notification.response.dto';
import {
  ApiPaginatedResponse,
  ApiProblemResponses,
} from '@/shared/platform/decorators/api-response.decorators';
import {
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOperation,
} from '@nestjs/swagger';

@ApiProblemResponses()
@ApiTags('Notifications')
@Controller('notifications')
export class NotificationController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @ApiOperation({ summary: 'Get My Notifications' })
  @Get()
  @ApiPaginatedResponse(NotificationResponseDto, 'offset')
  async getMyNotifications(
    @CurrentUser('id') userId: string,
    @Query() filter: FilterNotificationDto,
  ) {
    const query = new GetUserNotificationsQuery(
      userId,
      filter.actualPage,
      filter.actualLimit,
      filter.isRead,
    );

    const result = await this.queryBus.execute(query);

    const data = result.map(
      (notification: any) => new NotificationResponseDto(notification),
    );
    return {
      data: data,
      meta: buildPaginationMeta(
        filter.actualPage,
        Math.max(data.length, 1),
        data.length,
      ),
    };
  }

  @ApiOperation({ summary: 'Mark All Read' })
  @Patch('read-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  async markAllRead(@CurrentUser('id') userId: string) {
    const command = new MarkAllNotificationsReadCommand(userId);
    await this.commandBus.execute(command);
    return undefined;
  }

  @ApiOperation({ summary: 'Mark Read' })
  @Patch(':id/read')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  async markRead(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser('id') userId: string,
  ) {
    const command = new MarkNotificationReadCommand(userId, id);
    await this.commandBus.execute(command);
    return undefined;
  }

  @ApiOperation({ summary: 'Create' })
  @Post()
  @ApiCreatedResponse({ type: NotificationResponseDto })
  @Roles('admin')
  @UseGuards(RolesGuard)
  async create(@Body() dto: CreateNotificationDto) {
    const command = new CreateNotificationCommand(
      dto.userId,
      dto.title,
      dto.message,
      dto.type,
      dto.meta,
      dto.actionUrl,
    );

    const notification = await this.commandBus.execute(command);

    return new NotificationResponseDto(notification);
  }
}
