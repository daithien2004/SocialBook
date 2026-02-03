import {
  Controller,
  Get,
  Post,
  Param,
  Req,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { FollowsService } from './follows.service';

import { Public } from '@/src/common/decorators/customize';
import { JwtAuthGuard } from '@/src/common/guards/jwt-auth.guard';

@Controller('follows')
export class FollowsController {
  constructor(private readonly followsService: FollowsService) { }

  @Public()
  @Get('following')
  @HttpCode(HttpStatus.OK)
  async getFollowingList(@Query('userId') userId: string) {
    const data = await this.followsService.getFollowingList(userId);
    return {
      message: 'Get following list successfully',
      data,
    };
  }

  @Get('followers')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getFollowersList(
    @Req() req: Request & { user: { id: string } },
    @Query('targetUserId') targetUserId: string,
  ) {
    const currentUserId = req.user.id;

    const data = await this.followsService.getFollowersList(
      targetUserId,
      currentUserId,
    );

    return {
      message: 'Get followers list successfully',
      data,
    };
  }

  @Get('following-stats')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getFollowersStatsList(
    @Req() req: Request & { user: { id: string } },
    @Query('targetUserId') targetUserId: string,
  ) {
    const currentUserId = req.user.id;

    const data = await this.followsService.getFollowingStatsList(
      targetUserId,
      currentUserId,
    );

    return {
      message: 'Get following list successfully',
      data,
    };
  }

  @Get(':targetUserId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getStatus(
    @Req() req: Request & { user: { id: string } },
    @Param('targetUserId') targetUserId: string,
  ) {
    const data = await this.followsService.getStatus(req.user.id, targetUserId);
    return {
      message: 'Get follow status successfully',
      data,
    };
  }

  @Post(':targetUserId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async toggle(@Req() req: Request & { user: { id: string } }, @Param('targetUserId') targetUserId: string) {
    const result = await this.followsService.toggle(req.user.id, targetUserId);

    return {
      message: result.isFollowing
        ? 'Followed successfully'
        : 'Unfollowed successfully',
      data: result,
    };
  }
}
