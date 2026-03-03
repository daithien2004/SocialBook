import {
  Body,
  Controller,
  Get,
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
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';

import { Public } from '@/common/decorators/customize';
import { Roles } from '@/common/decorators/roles.decorator';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';

import { CreateUserDto, UpdateUserOverviewDto } from '@/presentation/users/dto/user.dto';
import { FilterUserDto } from '@/presentation/users/dto/filter-user.dto';
import { UpdateReadingPreferencesDto } from '@/presentation/users/dto/update-reading-preferences.dto';
import { UserResponseDto } from '@/presentation/users/dto/user.response.dto';

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
import { ToggleBanCommand } from '@/application/users/use-cases/toggle-ban/toggle-ban.command';
import { GetUserProfileUseCase } from '@/application/users/use-cases/get-user-profile/get-user-profile.use-case';
import { GetUserProfileQuery } from '@/application/users/use-cases/get-user-profile/get-user-profile.query';
import { CheckUserExistUseCase } from '@/application/users/use-cases/check-user-exist/check-user-exist.use-case';
import { CheckUserExistQuery } from '@/application/users/use-cases/check-user-exist/check-user-exist.query';
import { UpdateUserImageUseCase } from '@/application/users/use-cases/update-user-image/update-user-image.use-case';
import { UpdateUserImageCommand } from '@/application/users/use-cases/update-user-image/update-user-image.command';
import { GetReadingPreferencesUseCase } from '@/application/users/use-cases/get-reading-preferences/get-reading-preferences.use-case';
import { GetReadingPreferencesQuery } from '@/application/users/use-cases/get-reading-preferences/get-reading-preferences.query';
import { UpdateReadingPreferencesUseCase } from '@/application/users/use-cases/update-reading-preferences/update-reading-preferences.use-case';
import { UpdateReadingPreferencesCommand } from '@/application/users/use-cases/update-reading-preferences/update-reading-preferences.command';
import { SearchUsersUseCase } from '@/application/users/use-cases/search-users/search-users.use-case';
import { SearchUsersQuery } from '@/application/users/use-cases/search-users/search-users.query';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly getUsersUseCase: GetUsersUseCase,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    private readonly getUserByIdUseCase: GetUserByIdUseCase, // Not used directly in this controller yet?
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
  async findAllAdmin(
    @Query() filter: FilterUserDto,
  ) {
    const getUsersQuery = new GetUsersQuery(
      filter.page,
      filter.limit,
      filter.username,
      filter.email,
      filter.roleId,
      filter.isBanned,
      filter.isVerified
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
  async findAll(
    @Query() filter: FilterUserDto,
  ) {
    const getUsersQuery = new GetUsersQuery(
      filter.page,
      filter.limit,
      filter.username,
      filter.email,
      filter.roleId,
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
  async toggleBan(@Param('id') id: string) {
    const command = new ToggleBanCommand(id);
    const user = await this.toggleBanUseCase.execute(command);
    return {
      message: `User ${user.isBanned ? 'banned' : 'unbanned'} successfully`,
      data: new UserResponseDto(user),
    };
  }

  @Public()
  @Get(':id/overview')
  async getUserProfileOverview(@Param('id') id: string) {
    const query = new GetUserProfileQuery(id);
    const data = await this.getUserProfileUseCase.execute(query);
    return {
      message: 'Get user profile overview successfully',
      data,
    };
  }

  @Public()
  @Get(':id/exist')
  async isUserExist(@Param('id') id: string) {
    const query = new CheckUserExistQuery(undefined, undefined, id);
    const exists = await this.checkUserExistUseCase.execute(query);
    return {
      message: 'Check user exist successfully',
      data: exists,
    };
  }

  @Patch('me/overview')
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
      required: ['file']
    },
  })
  @UseInterceptors(FileInterceptor('file')) // field name = "file"
  async updateMyAvatar(
    @Req() req: Request & { user: { id: string } },
    @UploadedFile() file: Express.Multer.File,
  ) {
    const command = new UpdateUserImageCommand(req.user.id);
    const result = await this.updateUserImageUseCase.execute(command, file);
    return {
      message: 'Update avatar successfully',
      data: result
    };
  }

  @Get('me/reading-preferences')
  async getMyReadingPreferences(@Req() req: Request & { user: { id: string } }) {
    const query = new GetReadingPreferencesQuery(req.user.id);
    const data = await this.getReadingPreferencesUseCase.execute(query);
    return {
      message: 'Get reading preferences successfully',
      data,
    };
  }

  @Put('me/reading-preferences')
  async updateMyReadingPreferences(
    @Req() req: Request & { user: { id: string } },
    @Body() dto: UpdateReadingPreferencesDto,
  ) {
    const command = new UpdateReadingPreferencesCommand(
      req.user.id,
      dto.theme,
      dto.fontSize,
      dto.fontFamily,
      dto.lineHeight,
      dto.letterSpacing,
      dto.backgroundColor,
      dto.textColor,
      dto.textAlign,
      dto.marginWidth,
      dto.preferredGenres,
      dto.dailyReadingGoal
    );

    
    const user = await this.updateReadingPreferencesUseCase.execute(command);

    // Since we need to return readingPreferences according to previous code
    return {
      message: 'Reading preferences updated successfully',
      data: user.readingPreferences,
    };
  }

  @Public()
  @Get('search')
  async searchUsers(
    @Query() filter: FilterUserDto,
  ) {
    const keyword = filter.username || filter.email || '';
    const query = new SearchUsersQuery(keyword, filter.page, filter.limit);
    const result = await this.searchUsersUseCase.execute(query);

    return {
      message: 'Search users successfully',
      data: result.data.map(user => new UserResponseDto(user)),
      meta: result.meta,
    };
  }

}
