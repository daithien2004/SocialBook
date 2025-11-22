import { Controller, Get, Post, Body, Patch, Param, Delete, Req } from '@nestjs/common';
import { Types } from 'mongoose';
import { FollowsService } from './folllows.service';

@Controller('follows')
export class FollowsController {
  constructor(private readonly followsService: FollowsService) {}

  @Get(':targetUserId')
  async getFollowState(
    @Req() req: any,
    @Param('targetUserId') targetUserId: string,
  ) {
    return this.followsService.getFollowState(
      req.user.id,
      new Types.ObjectId(targetUserId),
    );
  }

  @Post(':targetUserId')
  async toggleFollow(
    @Req() req: any,
    @Param('targetUserId') targetUserId: string,
  ) {
    return this.followsService.toggleFollowUser(
      req.user.id,
      new Types.ObjectId(targetUserId),
    );
  }
}
