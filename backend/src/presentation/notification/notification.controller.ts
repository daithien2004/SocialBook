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
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

import { CreateNotificationCommand } from '@/application/notifications/use-cases/create-notification/create-notification.command';
import { CreateNotificationUseCase } from '@/application/notifications/use-cases/create-notification/create-notification.use-case';
import { GetUserNotificationsQuery } from '@/application/notifications/use-cases/get-user-notification/get-user-notifications.query';
import { GetUserNotificationsUseCase } from '@/application/notifications/use-cases/get-user-notification/get-user-notifications.use-case';
import { MarkNotificationReadCommand } from '@/application/notifications/use-cases/mark-notification/mark-notification-read.command';
import { MarkNotificationReadUseCase } from '@/application/notifications/use-cases/mark-notification/mark-notification-read.use-case';
import { CreateNotificationDto } from '@/presentation/notification/dto/create-notification.dto';

import { FilterNotificationDto } from '@/presentation/notification/dto/filter-notification.dto';
import { NotificationResponseDto } from '@/presentation/notification/dto/notification.response.dto';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(
    private readonly createNotificationUseCase: CreateNotificationUseCase,
    private readonly getUserNotificationsUseCase: GetUserNotificationsUseCase,
    private readonly markNotificationReadUseCase: MarkNotificationReadUseCase,
  ) {}

  @Get()
  async getMyNotifications(
    @CurrentUser('id') userId: string,
    @Query() filter: FilterNotificationDto,
  ) {
    const query = new GetUserNotificationsQuery(
      userId,
      filter.page,
      filter.limit,
      filter.isRead,
    );

    const result = await this.getUserNotificationsUseCase.execute(query);

    return {
      message: 'Get notifications successfully',
      data: result.map(
        (notification) => new NotificationResponseDto(notification),
      ),
    };
  }

  @Patch(':id/read')
  async markRead(@Param('id') id: string, @CurrentUser('id') userId: string) {
    const command = new MarkNotificationReadCommand(userId, id);
    await this.markNotificationReadUseCase.execute(command);
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

    const notification = await this.createNotificationUseCase.execute(command);

    return {
      message: 'Notification created successfully',
      data: new NotificationResponseDto(notification),
    };
  }
}
