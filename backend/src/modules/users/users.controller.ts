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
import { RolesGuard } from '@/src/common/guards/roles.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createUserDto: CreateUserDto) {
    const user = await this.usersService.create(createUserDto);
    return {
      message: 'User created successfully',
      data: {
        id: user._id.toString(),
        email: user.email,
      },
    };
  }

  @Public()
  @Get()
  async findAll(
    @Query() query: string,
    @Query('current') current: string,
    @Query('pageSize') pageSize: string,
  ) {
    const result = await this.usersService.findAll(query, +current, +pageSize);
    return {
      message: 'Users retrieved successfully',
      data: result,
    };
  }

  @Roles('admin')
  @UseGuards(RolesGuard)
  @Patch(':id/ban')
  @HttpCode(HttpStatus.OK)
  async toggleBan(@Param('id') id: string) {
    const user = await this.usersService.toggleBan(id);
    return {
      message: `User ${user.isBanned ? 'banned' : 'unbanned'} successfully`,
      data: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        isBanned: user.isBanned,
      },
    };
  }

  @Public()
  @Get(':id/overview')
  async getUserProfileOverview(@Param('id') id: string) {
    return await this.usersService.getUserProfileOverview(id);
  }
}
