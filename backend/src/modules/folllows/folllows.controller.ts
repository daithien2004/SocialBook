import { Controller, Get, Post, Body, Patch, Param, Delete, Req, Query } from '@nestjs/common';
import { Types } from 'mongoose';
import { FollowsService } from './folllows.service';
import { Public } from '@/src/common/decorators/customize';

@Controller('follows')
export class FollowsController {
  constructor(private readonly followsService: FollowsService) {}

  @Get(':targetUserId')
  async getFollowState(
    @Req() req: any,
    @Param('targetUserId') targetUserId: string,
  ) {
    return this.followsService.getFollowState(
      new Types.ObjectId(req.user.id),
      new Types.ObjectId(targetUserId),
    );
  }

  @Post(':targetUserId')
  async toggleFollow(
    @Req() req: any,
    @Param('targetUserId') targetUserId: string,
  ) {
    return this.followsService.toggleFollowUser(
      new Types.ObjectId(req.user.id,),
      new Types.ObjectId(targetUserId),
    );
  }

  @Public()
  @Get()
  async getFollowingList(@Query('currentUserId') currentUserId: string) {
    return this.followsService.getFollowingList(
      new Types.ObjectId(currentUserId),
    );
  }
}
