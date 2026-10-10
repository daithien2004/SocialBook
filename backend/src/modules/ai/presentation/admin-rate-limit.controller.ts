import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/shared/platform/guards/jwt-auth.guard';
import { RolesGuard } from '@/shared/platform/guards/roles.guard';
import { Roles } from '@/shared/platform/decorators/roles.decorator';
import { RateLimitConfigService } from '../infrastructure/rate-limit/public-api';
import { UpdateRateLimitDto } from './dto/update-rate-limit.dto';
import { ApiProblemResponses } from '@/shared/platform/decorators/api-response.decorators';

@ApiTags('Admin Rate Limits')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@ApiProblemResponses()
@Controller('admin/rate-limits')
export class AdminRateLimitController {
  constructor(
    private readonly rateLimitConfigService: RateLimitConfigService,
  ) {}

  @Get('ai')
  @ApiOperation({ summary: 'Láº¥y cáº¥u hÃ¬nh rate limit cho AI' })
  async getAIConfig() {
    const config = await this.rateLimitConfigService.getAIConfig();
    return config;
  }

  @Put('ai')
  @ApiOperation({ summary: 'Cáº­p nháº­t cáº¥u hÃ¬nh rate limit cho AI' })
  async updateAIConfig(@Body() dto: UpdateRateLimitDto) {
    const config = await this.rateLimitConfigService.updateAIConfig(dto);
    return config;
  }
}
