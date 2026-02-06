import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { UpdateReadingPreferencesDto } from './dto/update-reading-preferences.dto';
import { CreateUserDto, UpdateUserOverviewDto } from './dto/user.dto';
import { UsersService } from './users.service';

import { Public } from '@/src/common/decorators/customize';
import { Roles } from '@/src/common/decorators/roles.decorator';
import { JwtAuthGuard } from '@/src/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/src/common/guards/roles.guard';
import { FileInterceptor } from '@nestjs/platform-express';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, description: 'User created' })
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createUserDto: CreateUserDto) {
    const data = await this.usersService.create(createUserDto);
    return {
      message: 'User created successfully',
      data,
    };
  }

  @Get('admin')
  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Get all users (Admin)' })
  @ApiQuery({ name: 'current', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @HttpCode(HttpStatus.OK)
  async findAllAdmin(
    @Query() query: any,
    @Query('current') current: string,
    @Query('pageSize') pageSize: string,
  ) {
    const result = await this.usersService.findAll(query, +current, +pageSize);
    return {
      message: 'Get users successfully',
      data: result.data,
      pagination: {
        ...result.meta,
        totalItems: result.meta.total,
      },
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
      data: result.data,
      pagination: {
        ...result.meta,
        totalItems: result.meta.total,
      },
    };
  }

  @Patch(':id/ban')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Ban or unban a user' })
  @ApiParam({ name: 'id', type: 'string' })
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
  @ApiOperation({ summary: 'Get user profile overview' })
  @ApiParam({ name: 'id', type: 'string' })
  @HttpCode(HttpStatus.OK)
  async getUserProfileOverview(@Param('id') id: string) {
    const data = await this.usersService.getUserProfileOverview(id);
    return {
      message: 'Get user profile overview successfully',
      data,
    };
  }

  @Public()
  @Get(':id/exist')
  @HttpCode(HttpStatus.OK)
  async isUserExist(@Param('id') id: string) {
    const data = await this.usersService.isUserExist(id);
    return {
      message: 'Check user exist successfully',
      data,
    };
  }

  @Patch('me/overview')
  @HttpCode(HttpStatus.OK)
  async updateMyProfileOverview(
    @Req() req: Request & { user: { id: string } },
    @Body() dto: UpdateUserOverviewDto,
  ) {
    const data = await this.usersService.updateUserProfileOverview(
      req.user.id,
      dto,
    );
    return {
      message: 'Profile overview updated successfully',
      data,
    };
  }

  @Patch('me/avatar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update user avatar' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file')) // field name = "file"
  async updateMyAvatar(
    @Req() req: Request & { user: { id: string } },
    @UploadedFile() file: Express.Multer.File,
  ) {
    const result = await this.usersService.updateUserImage(req.user.id, file);
    return {
      message: 'Update avatar successfully',
      data: result
    };
  }

  // Cá nhân hóa trải nghiệm đọc
  @Get('me/reading-preferences')
  @ApiOperation({ summary: 'Get my reading preferences' })
  @HttpCode(HttpStatus.OK)
  async getMyReadingPreferences(@Req() req: Request & { user: { id: string } }) {
    const data = await this.usersService.getReadingPreferences(req.user.id);
    return {
      message: 'Get reading preferences successfully',
      data,
    };
  }

  @Put('me/reading-preferences')
  @ApiOperation({ summary: 'Update reading preferences' })
  @HttpCode(HttpStatus.OK)
  async updateMyReadingPreferences(
    @Req() req: Request & { user: { id: string } },
    @Body() dto: UpdateReadingPreferencesDto,
  ) {
    const data = await this.usersService.updateReadingPreferences(
      req.user.id,
      dto,
    );
    return {
      message: 'Reading preferences updated successfully',
      data,
    };
  }

  @Public()
  @Get('search')
  @ApiOperation({ summary: 'Search users' })
  @ApiQuery({ name: 'keyword', required: true })
  @ApiQuery({ name: 'current', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @HttpCode(HttpStatus.OK)
  async searchUsers(
    @Query('keyword') keyword: string,
    @Query('current') current: string,
    @Query('pageSize') pageSize: string,
  ) {
    const result = await this.usersService.searchUsersByUsername(
      keyword,
      +current,
      +pageSize,
    );

    return {
      message: 'Search users successfully',
      data: result.data,
      meta: result.meta,
    };
  }

}
