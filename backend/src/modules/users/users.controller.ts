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
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/user.dto';

import { Public } from '@/src/common/decorators/customize';
import { Roles } from '@/src/common/decorators/roles.decorator';
import { JwtAuthGuard } from '@/src/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/src/common/guards/roles.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createUserDto: CreateUserDto) {
    const data = await this.usersService.create(createUserDto);
    return {
      message: 'User created successfully',
      data,
    };
  }

  @Public()
  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Query() query: any,
    @Query('current') current: string,
    @Query('pageSize') pageSize: string,
  ) {
    const result = await this.usersService.findAll(query, +current, +pageSize);
    return {
      message: 'Get users successfully',
      ...result,
    };
  }

  @Patch(':id/ban')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  async toggleBan(@Param('id') id: string) {
    const data = await this.usersService.toggleBan(id);
    return {
      message: `User ${data.isBanned ? 'banned' : 'unbanned'} successfully`,
      data,
    };
  }

  @Public()
  @Get(':id/overview')
  @HttpCode(HttpStatus.OK)
  async getUserProfileOverview(@Param('id') id: string) {
    const data = await this.usersService.getUserProfileOverview(id);
    return {
      message: 'Get user profile overview successfully',
      data,
    };
  }
}
