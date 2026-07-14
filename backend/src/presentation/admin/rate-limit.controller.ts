import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { RateLimitConfigService } from '@/common/services/rate-limit-config.service';
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

  @Get('gemini')
  @ApiOperation({ summary: 'Lấy cấu hình rate limit cho Gemini AI' })
  async getGeminiConfig() {
    const config = await this.rateLimitConfigService.getGeminiConfig();
    return { data: config };
  }

  @Put('gemini')
  @ApiOperation({ summary: 'Cập nhật cấu hình rate limit cho Gemini AI' })
  async updateGeminiConfig(@Body() dto: UpdateRateLimitDto) {
    const config = await this.rateLimitConfigService.updateGeminiConfig(dto);
    return { message: 'Cập nhật cấu hình rate limit thành công', data: config };
  }
}
