import { unpaginated } from '@/shared/platform/dto/paginated.dto';
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
import { ApiCreatedResponse, ApiNoContentResponse } from '@nestjs/swagger';

@ApiProblemResponses()
@Controller('notifications')
export class NotificationController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

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

    return unpaginated(
      result.map(
        (notification: any) => new NotificationResponseDto(notification),
      ),
    );
  }

  @Patch('read-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  async markAllRead(@CurrentUser('id') userId: string) {
    const command = new MarkAllNotificationsReadCommand(userId);
    await this.commandBus.execute(command);
    return undefined;
  }

  @Patch(':id/read')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  async markRead(@Param('id') id: string, @CurrentUser('id') userId: string) {
    const command = new MarkNotificationReadCommand(userId, id);
    await this.commandBus.execute(command);
    return undefined;
  }

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
