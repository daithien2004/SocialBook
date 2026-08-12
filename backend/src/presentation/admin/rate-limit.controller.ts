import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { RateLimitConfigService } from '@/shared/infrastructure/rate-limit-config.service';
import { UpdateRateLimitDto } from './dto/update-rate-limit.dto';

@ApiTags('Admin Rate Limits')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin/rate-limits')
export class AdminRateLimitController {
  constructor(
    private readonly rateLimitConfigService: RateLimitConfigService,
  ) {}

  @Get('ai')
  @ApiOperation({ summary: 'Lấy cấu hình rate limit cho AI' })
  async getAIConfig() {
    const config = await this.rateLimitConfigService.getAIConfig();
    return { data: config };
  }

  @Put('ai')
  @ApiOperation({ summary: 'Cập nhật cấu hình rate limit cho AI' })
  async updateAIConfig(@Body() dto: UpdateRateLimitDto) {
    const config = await this.rateLimitConfigService.updateAIConfig(dto);
    return { message: 'Cập nhật cấu hình rate limit thành công', data: config };
  }
}
