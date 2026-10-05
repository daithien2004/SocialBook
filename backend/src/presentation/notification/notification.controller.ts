import { Dispatcher } from '@/application/common/dispatcher';
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { Roles } from '@/common/decorators/roles.decorator';
import { RolesGuard } from '@/common/guards/roles.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

import { CreateNotificationCommand } from '@/application/notifications/commands/create-notification/create-notification.command';
import { GetUserNotificationsQuery } from '@/application/notifications/queries/get-user-notification/get-user-notifications.query';
import { MarkNotificationReadCommand } from '@/application/notifications/commands/mark-notification/mark-notification-read.command';
import { MarkAllNotificationsReadCommand } from '@/application/notifications/commands/mark-notification/mark-all-notifications-read.command';
import { CreateNotificationDto } from '@/presentation/notification/dto/create-notification.dto';

import { FilterNotificationDto } from '@/presentation/notification/dto/filter-notification.dto';
import { NotificationResponseDto } from '@/presentation/notification/dto/notification.response.dto';

@Controller('notifications')
export class NotificationController {
  constructor(private readonly dispatcher: Dispatcher) {}

  @Get()
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

    const result = await this.dispatcher.query(query);

    return {
      message: 'Get notifications successfully',
      data: result.map(
        (notification: any) => new NotificationResponseDto(notification),
      ),
    };
  }

  @Patch('read-all')
  async markAllRead(@CurrentUser('id') userId: string) {
    const command = new MarkAllNotificationsReadCommand(userId);
    await this.dispatcher.command(command);
    return {
      message: 'All notifications marked as read',
    };
  }

  @Patch(':id/read')
  async markRead(@Param('id') id: string, @CurrentUser('id') userId: string) {
    const command = new MarkNotificationReadCommand(userId, id);
    await this.dispatcher.command(command);
    return {
      message: 'Notification marked as read',
    };
  }

  @Post()
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

    const notification = await this.dispatcher.command(command);

    return {
      message: 'Notification created successfully',
      data: new NotificationResponseDto(notification),
    };
  }
}
