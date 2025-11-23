import {
    Controller,
    Get,
    Query,
    UseGuards,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { StatisticsService } from './statistics.service';
import { Roles } from '@/src/common/decorators/roles.decorator';
import { RolesGuard } from '@/src/common/guards/roles.guard';

@Controller('statistics')
@Roles('admin')
@UseGuards(RolesGuard)
export class StatisticsController {
    constructor(private readonly statisticsService: StatisticsService) { }

    @Get('overview')
    @HttpCode(HttpStatus.OK)
    async getOverview() {
        const data = await this.statisticsService.getOverview();
        return {
            message: 'Overview statistics retrieved successfully',
            data,
        };
    }

    @Get('users')
    @HttpCode(HttpStatus.OK)
    async getUserStats() {
        const data = await this.statisticsService.getUserStats();
        return {
            message: 'User statistics retrieved successfully',
            data,
        };
    }

    @Get('books')
    @HttpCode(HttpStatus.OK)
    async getBookStats() {
        const data = await this.statisticsService.getBookStats();
        return {
            message: 'Book statistics retrieved successfully',
            data,
        };
    }

    @Get('posts')
    @HttpCode(HttpStatus.OK)
    async getPostStats() {
        const data = await this.statisticsService.getPostStats();
        return {
            message: 'Post statistics retrieved successfully',
            data,
        };
    }

    @Get('growth')
    @HttpCode(HttpStatus.OK)
    async getGrowthMetrics(@Query('days') days?: string) {
        const numDays = days ? parseInt(days, 10) : 30;
        const data = await this.statisticsService.getGrowthMetrics(numDays);
        return {
            message: 'Growth metrics retrieved successfully',
            data,
        };
    }
}
