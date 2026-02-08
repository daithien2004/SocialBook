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
import { FileInterceptor } from '@nestjs/platform-express';

import { Public } from '@/common/decorators/customize';
import { Roles } from '@/common/decorators/roles.decorator';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';

import { CreateUserDto, UpdateUserOverviewDto } from '@/application/users/dto/user.dto';
import { UpdateReadingPreferencesDto } from '@/application/users/dto/update-reading-preferences.dto';
import { UserResponseDto } from '@/application/users/dto/user.response.dto';

import { CreateUserUseCase } from '@/application/users/use-cases/create-user/create-user.use-case';
import { CreateUserCommand } from '@/application/users/use-cases/create-user/create-user.command';
import { GetUsersUseCase } from '@/application/users/use-cases/get-users/get-users.use-case';
import { GetUsersQuery } from '@/application/users/use-cases/get-users/get-users.query';
import { GetUserByIdUseCase } from '@/application/users/use-cases/get-user-by-id/get-user-by-id.use-case';
import { UpdateUserUseCase } from '@/application/users/use-cases/update-user/update-user.use-case';
import { UpdateUserCommand } from '@/application/users/use-cases/update-user/update-user.command';
import { DeleteUserUseCase } from '@/application/users/use-cases/delete-user/delete-user.use-case';
import { DeleteUserCommand } from '@/application/users/use-cases/delete-user/delete-user.command';
import { ToggleBanUseCase } from '@/application/users/use-cases/toggle-ban/toggle-ban.use-case';
import { GetUserProfileUseCase } from '@/application/users/use-cases/get-user-profile/get-user-profile.use-case';
import { CheckUserExistUseCase } from '@/application/users/use-cases/check-user-exist/check-user-exist.use-case';
import { UpdateUserImageUseCase } from '@/application/users/use-cases/update-user-image/update-user-image.use-case';
import { GetReadingPreferencesUseCase } from '@/application/users/use-cases/get-reading-preferences/get-reading-preferences.use-case';
import { UpdateReadingPreferencesUseCase, UpdateReadingPreferencesCommand } from '@/application/users/use-cases/update-reading-preferences/update-reading-preferences.use-case';
import { SearchUsersUseCase } from '@/application/users/use-cases/search-users/search-users.use-case';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(
      private readonly createUserUseCase: CreateUserUseCase,
      private readonly getUsersUseCase: GetUsersUseCase,
      private readonly getUserByIdUseCase: GetUserByIdUseCase,
      private readonly updateUserUseCase: UpdateUserUseCase,
      private readonly deleteUserUseCase: DeleteUserUseCase,
      private readonly toggleBanUseCase: ToggleBanUseCase,
      private readonly getUserProfileUseCase: GetUserProfileUseCase,
      private readonly checkUserExistUseCase: CheckUserExistUseCase,
      private readonly updateUserImageUseCase: UpdateUserImageUseCase,
      private readonly getReadingPreferencesUseCase: GetReadingPreferencesUseCase,
      private readonly updateReadingPreferencesUseCase: UpdateReadingPreferencesUseCase,
      private readonly searchUsersUseCase: SearchUsersUseCase
  ) { }

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, description: 'User created' })
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createUserDto: CreateUserDto) {
    const command = new CreateUserCommand(
        createUserDto.username,
        createUserDto.email,
        createUserDto.password,
        createUserDto.roleId,
        createUserDto.image,
        createUserDto.provider,
        createUserDto.providerId
    );
    const user = await this.createUserUseCase.execute(command);
    return {
      message: 'User created successfully',
      data: new UserResponseDto(user),
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
      const page = +current || 1;
      const limit = +pageSize || 10;
      const getUsersQuery = new GetUsersQuery(
          page,
          limit,
          query.username,
          query.email,
          query.roleId,
          query.isBanned,
          query.isVerified
      );
      const result = await this.getUsersUseCase.execute(getUsersQuery);
      return {
          message: 'Get users successfully',
          data: result.data.map(user => new UserResponseDto(user)),
          meta: result.meta,
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
      const page = +current || 1;
      const limit = +pageSize || 10;
      const getUsersQuery = new GetUsersQuery(
          page,
          limit,
          query.username,
          query.email,
          query.roleId,
          undefined, 
          undefined  
      );
      const result = await this.getUsersUseCase.execute(getUsersQuery);
      return {
          message: 'Get users successfully',
          data: result.data.map(user => new UserResponseDto(user)),
          meta: result.meta,
      };
  }

  @Patch(':id/ban')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Ban or unban a user' })
  @ApiParam({ name: 'id', type: 'string' })
  @HttpCode(HttpStatus.OK)
  async toggleBan(@Param('id') id: string) {
    const user = await this.toggleBanUseCase.execute(id);
    return {
      message: `User ${user.isBanned ? 'banned' : 'unbanned'} successfully`,
      data: new UserResponseDto(user),
    };
  }

  @Public()
  @Get(':id/overview')
  @ApiOperation({ summary: 'Get user profile overview' })
  @ApiParam({ name: 'id', type: 'string' })
  @HttpCode(HttpStatus.OK)
  async getUserProfileOverview(@Param('id') id: string) {
    const data = await this.getUserProfileUseCase.execute(id);
    return {
      message: 'Get user profile overview successfully',
      data,
    };
  }

  @Public()
  @Get(':id/exist')
  @HttpCode(HttpStatus.OK)
  async isUserExist(@Param('id') id: string) {
    const exists = await this.checkUserExistUseCase.execute(id);
    return {
      message: 'Check user exist successfully',
      data: exists,
    };
  }

  @Patch('me/overview')
  @HttpCode(HttpStatus.OK)
  async updateMyProfileOverview(
    @Req() req: Request & { user: { id: string } },
    @Body() dto: UpdateUserOverviewDto,
  ) {
    const command = new UpdateUserCommand(
        req.user.id,
        dto.username,
        dto.bio,
        dto.location,
        dto.website
    );
    const user = await this.updateUserUseCase.execute(command);
    return {
      message: 'Profile overview updated successfully',
      data: new UserResponseDto(user),
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
    const result = await this.updateUserImageUseCase.execute(req.user.id, file);
    return {
      message: 'Update avatar successfully',
      data: result
    };
  }

  @Get('me/reading-preferences')
  @ApiOperation({ summary: 'Get my reading preferences' })
  @HttpCode(HttpStatus.OK)
  async getMyReadingPreferences(@Req() req: Request & { user: { id: string } }) {
    const data = await this.getReadingPreferencesUseCase.execute(req.user.id);
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
    const command = new UpdateReadingPreferencesCommand(req.user.id, dto);
    const user = await this.updateReadingPreferencesUseCase.execute(command);
    return {
      message: 'Reading preferences updated successfully',
      data: user.readingPreferences, // or return UserResponseDto logic
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
    const page = +current || 1;
    const limit = +pageSize || 10;
    const result = await this.searchUsersUseCase.execute(keyword, page, limit);

    return {
      message: 'Search users successfully',
      data: result.data.map(user => new UserResponseDto(user)),
      meta: result.meta,
    };
  }

}
