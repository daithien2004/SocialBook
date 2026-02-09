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
    Req,
    UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';

import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';

import { CreateNotificationDto } from '@/presentation/notification/dto/create-notification.dto'; // Need CreateNotificationDto? usually internal. Or create one.
import { CreateNotificationUseCase } from '@/application/notifications/use-cases/create-notification/create-notification.use-case';
import { CreateNotificationCommand } from '@/application/notifications/use-cases/create-notification/create-notification.command';
import { GetUserNotificationsUseCase } from '@/application/notifications/use-cases/get-user-notification/get-user-notifications.use-case';
import { GetUserNotificationsQuery } from '@/application/notifications/use-cases/get-user-notification/get-user-notifications.query';
import { MarkNotificationReadUseCase } from '@/application/notifications/use-cases/mark-notification/mark-notification-read.use-case';
import { MarkNotificationReadCommand } from '@/application/notifications/use-cases/mark-notification/mark-notification-read.command';

import { NotificationResponseDto } from '@/presentation/notification/dto/notification.response.dto';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
    constructor(
        private readonly createNotificationUseCase: CreateNotificationUseCase,
        private readonly getUserNotificationsUseCase: GetUserNotificationsUseCase,
        private readonly markNotificationReadUseCase: MarkNotificationReadUseCase,
    ) { }

    @Get()
    @ApiOperation({ summary: 'Get my notifications' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'isRead', required: false, type: Boolean })
    @HttpCode(HttpStatus.OK)
    async getMyNotifications(
        @Req() req: Request & { user: { id: string } },
        @Query('page') page: string = '1',
        @Query('limit') limit: string = '10',
        @Query('isRead') isRead?: string,
    ) {
        const isReadBool = isRead === 'true' ? true : isRead === 'false' ? false : undefined;
        const query = new GetUserNotificationsQuery(
            req.user.id,
            Number(page),
            Number(limit),
            isReadBool
        );

        const result = await this.getUserNotificationsUseCase.execute(query);

        return {
            message: 'Get notifications successfully',
            data: result.map(notification => new NotificationResponseDto(notification)),
        };
    }

    @Patch(':id/read')
    @ApiOperation({ summary: 'Mark notification as read' })
    @ApiParam({ name: 'id', type: 'string' })
    @HttpCode(HttpStatus.OK)
    async markRead(
        @Param('id') id: string,
        @Req() req: Request & { user: { id: string } }
    ) {
        const command = new MarkNotificationReadCommand(req.user.id, id);
        await this.markNotificationReadUseCase.execute(command);
        return {
            message: 'Notification marked as read',
        };
    }

    // Admin endpoint to manually create notification (for testing or system notifications)
    @Post()
    @Roles('admin')
    @UseGuards(RolesGuard)
    @ApiOperation({ summary: 'Create notification (Admin)' })
    @ApiBody({ type: CreateNotificationDto })
    @HttpCode(HttpStatus.CREATED)
    async create(
        @Body() dto: CreateNotificationDto
    ) {
        const command = new CreateNotificationCommand(
            dto.userId,
            dto.title,
            dto.message,
            dto.type,
            dto.meta,
            dto.actionUrl
        );

        const notification = await this.createNotificationUseCase.execute(command);

        return {
            message: 'Notification created successfully',
            data: new NotificationResponseDto(notification),
        };
    }
}
