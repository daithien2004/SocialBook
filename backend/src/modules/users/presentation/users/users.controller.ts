import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  Body,
  Controller,
  FileTypeValidator,
  Get,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  Patch,
  Post,
  Put,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import { Public } from '@/common/decorators/custom.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { RolesGuard } from '@/common/guards/roles.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

import { FilterUserDto } from '@/modules/users/presentation/users/dto/filter-user.dto';
import { UpdateReadingPreferencesDto } from '@/modules/users/presentation/users/dto/update-reading-preferences.dto';
import {
  CreateUserDto,
  UpdateUserOverviewDto,
} from '@/modules/users/presentation/users/dto/user.dto';
import { UserResponseDto } from '@/modules/users/presentation/users/dto/user.response.dto';

import { CheckUserExistQuery } from '@/modules/users/application/users/commands/check-user-exist/check-user-exist.query';
import { CreateUserCommand } from '@/modules/users/application/users/commands/create-user/create-user.command';
import { GetReadingPreferencesQuery } from '@/modules/users/application/users/queries/get-reading-preferences/get-reading-preferences.query';
import { GetUserProfileQuery } from '@/modules/users/application/users/queries/get-user-profile/get-user-profile.query';
import { GetUsersQuery } from '@/modules/users/application/users/queries/get-users/get-users.query';
import { SearchUsersQuery } from '@/modules/users/application/users/commands/search-users/search-users.query';
import { ToggleBanCommand } from '@/modules/users/application/users/commands/toggle-ban/toggle-ban.command';
import { UpdateReadingPreferencesCommand } from '@/modules/users/application/users/commands/update-reading-preferences/update-reading-preferences.command';
import { UpdateUserImageCommand } from '@/modules/users/application/users/commands/update-user-image/update-user-image.command';
import { UpdateUserCommand } from '@/modules/users/application/users/commands/update-user/update-user.command';

import { User } from '@/modules/users/domain/users/entities/user.entity';

@Controller('users')
export class UsersController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    const command = new CreateUserCommand(
      createUserDto.username,
      createUserDto.email,
      createUserDto.password,
      createUserDto.roleId,
      createUserDto.image,
      createUserDto.provider,
      createUserDto.providerId,
    );
    const user = await this.commandBus.execute(command);
    return {
      message: 'User created successfully',
      data: new UserResponseDto(user),
    };
  }

  @Get('admin')
  @Roles('admin')
  @UseGuards(RolesGuard)
  async findAllAdmin(@Query() filter: FilterUserDto) {
    const getUsersQuery = new GetUsersQuery(
      filter.actualPage,
      filter.actualLimit,
      filter.username,
      filter.email,
      filter.roleId,
      filter.isBanned,
      filter.isVerified,
    );
    const result = await this.queryBus.execute(getUsersQuery);
    return {
      message: 'Get users successfully',
      data: result.data.map((user: User) => new UserResponseDto(user)),
      meta: result.meta,
    };
  }

  @Public()
  @Get()
  async findAll(@Query() filter: FilterUserDto) {
    const getUsersQuery = new GetUsersQuery(
      filter.actualPage,
      filter.actualLimit,
      filter.username,
      filter.email,
      filter.roleId,
      undefined,
      undefined,
    );
    const result = await this.queryBus.execute(getUsersQuery);
    return {
      message: 'Get users successfully',
      data: result.data.map((user: User) => new UserResponseDto(user)),
      meta: result.meta,
    };
  }

  @Patch(':id/ban')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async toggleBan(@Param('id') id: string) {
    const command = new ToggleBanCommand(id);
    const user = await this.commandBus.execute(command);
    return {
      message: `User ${user.isBanned ? 'banned' : 'unbanned'} successfully`,
      data: new UserResponseDto(user),
    };
  }

  @Public()
  @Get(':id/overview')
  async getUserProfileOverview(@Param('id') id: string) {
    const query = new GetUserProfileQuery(id);
    const data = await this.queryBus.execute(query);
    return {
      message: 'Get user profile overview successfully',
      data,
    };
  }

  @Public()
  @Get(':id/exist')
  async isUserExist(@Param('id') id: string) {
    const query = new CheckUserExistQuery(undefined, undefined, id);
    const exists = await this.queryBus.execute(query);
    return {
      message: 'Check user exist successfully',
      data: exists,
    };
  }

  @Patch('me/overview')
  async updateMyProfileOverview(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateUserOverviewDto,
  ) {
    const command = new UpdateUserCommand(
      userId,
      dto.username,
      dto.bio,
      dto.location,
      dto.website,
    );
    const user = await this.commandBus.execute(command);
    return {
      message: 'Profile overview updated successfully',
      data: new UserResponseDto(user),
    };
  }

  @Patch('me/avatar')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async updateMyAvatar(
    @CurrentUser('id') userId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
          new FileTypeValidator({
            fileType: /^(image\/jpeg|image\/png|image\/webp|image\/avif)$/,
          }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    const command = new UpdateUserImageCommand(userId, file);
    const result = await this.commandBus.execute(command);
    return {
      message: 'Update avatar successfully',
      data: result,
    };
  }

  @Get('me/reading-preferences')
  async getMyReadingPreferences(@CurrentUser('id') userId: string) {
    const query = new GetReadingPreferencesQuery(userId);
    const data = await this.queryBus.execute(query);
    return {
      message: 'Get reading preferences successfully',
      data,
    };
  }

  @Put('me/reading-preferences')
  async updateMyReadingPreferences(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateReadingPreferencesDto,
  ) {
    const command = new UpdateReadingPreferencesCommand(
      userId,
      dto.theme,
      dto.fontSize,
      dto.fontFamily,
      dto.lineHeight,
      dto.letterSpacing,
      dto.backgroundColor,
      dto.textColor,
      dto.textAlign,
      dto.marginWidth,
      dto.warmth,
      dto.brightness,
      dto.preferredGenres,
      dto.dailyReadingGoal,
    );

    const user = await this.commandBus.execute(command);

    return {
      message: 'Reading preferences updated successfully',
      data: user.readingPreferences,
    };
  }

  @Public()
  @Get('search')
  async searchUsers(@Query() filter: FilterUserDto) {
    const keyword = filter.username || filter.email || '';
    const query = new SearchUsersQuery(
      keyword,
      filter.actualPage,
      filter.actualLimit,
    );
    const result = await this.queryBus.execute(query);

    return {
      message: 'Search users successfully',
      data: result.data.map((user: User) => new UserResponseDto(user)),
      meta: result.meta,
    };
  }
}
