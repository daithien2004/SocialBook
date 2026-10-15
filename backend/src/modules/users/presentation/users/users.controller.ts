import { ApiTags } from '@nestjs/swagger';
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
  ParseUUIDPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import { Public } from '@/shared/platform/decorators/custom.decorator';
import { CurrentUser } from '@/shared/platform/decorators/current-user.decorator';
import { CurrentActor } from '@/shared/platform/decorators/current-actor.decorator';
import type { Actor } from '@/shared/casl/actor';
import { CheckPolicy } from '@/shared/casl/check-policy.decorator';
import { PoliciesGuard } from '@/shared/casl/policies.guard';

import { FilterUserDto } from '@/modules/users/presentation/users/dto/filter-user.dto';
import { UpdateReadingPreferencesDto } from '@/modules/users/presentation/users/dto/update-reading-preferences.dto';
import {
  CreateUserDto,
  UpdateUserOverviewDto,
} from '@/modules/users/presentation/users/dto/user.dto';
import { UserResponseDto } from '@/modules/users/presentation/users/dto/user.response.dto';
import { UserProfileOverviewResponseDto } from '@/modules/users/presentation/users/dto/user-profile-overview.response.dto';
import { PublicUserResponseDto } from '@/modules/users/presentation/users/dto/public-user.response.dto';
import { ReadingPreferencesResponseDto } from '@/modules/users/presentation/users/dto/reading-preferences.response.dto';
import { AvatarResponseDto } from '@/modules/users/presentation/users/dto/avatar.response.dto';

import { CheckUserExistQuery } from '@/modules/users/application/users/queries/check-user-exist/check-user-exist.query';
import { CreateUserCommand } from '@/modules/users/application/users/commands/create-user/create-user.command';
import { GetReadingPreferencesQuery } from '@/modules/users/application/users/queries/get-reading-preferences/get-reading-preferences.query';
import { GetUserProfileQuery } from '@/modules/users/application/users/queries/get-user-profile/get-user-profile.query';
import { GetUsersQuery } from '@/modules/users/application/users/queries/get-users/get-users.query';
import { SearchUsersQuery } from '@/modules/users/application/users/queries/search-users/search-users.query';
import { ToggleBanCommand } from '@/modules/users/application/users/commands/toggle-ban/toggle-ban.command';
import { UpdateReadingPreferencesCommand } from '@/modules/users/application/users/commands/update-reading-preferences/update-reading-preferences.command';
import { UpdateUserImageCommand } from '@/modules/users/application/users/commands/update-user-image/update-user-image.command';
import { UpdateUserCommand } from '@/modules/users/application/users/commands/update-user/update-user.command';

import {
  ApiPaginatedResponse,
  ApiProblemResponses,
} from '@/shared/platform/decorators/api-response.decorators';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger';
import { paginate } from '@/shared/domain/pagination.types';
import type { PageResult } from '@/shared/domain/pagination.types';
import type { PublicUserReadModel } from '@/modules/users/application/read-models/public-user.read-model';

@ApiProblemResponses()
@ApiTags('Users')
@Controller('users')
@UseGuards(PoliciesGuard)
export class UsersController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @ApiOperation({ summary: 'Create' })
  @CheckPolicy('manage', 'User')
  @Post()
  @ApiCreatedResponse({ type: UserResponseDto })
  async create(
    @CurrentActor() actor: Actor,
    @Body() createUserDto: CreateUserDto,
  ) {
    const command = new CreateUserCommand(
      actor,
      createUserDto.username,
      createUserDto.email,
      createUserDto.password,
      createUserDto.roleId,
      createUserDto.image,
      createUserDto.provider,
      createUserDto.providerId,
    );
    const user = await this.commandBus.execute(command);
    return new UserResponseDto(user);
  }

  @ApiOperation({ summary: 'Find All Admin' })
  @Get('admin')
  @ApiPaginatedResponse(UserResponseDto, 'offset')
  @CheckPolicy('manage', 'User')
  async findAllAdmin(
    @CurrentActor() actor: Actor,
    @Query() filter: FilterUserDto,
  ) {
    const getUsersQuery = new GetUsersQuery(
      actor,
      filter.actualPage,
      filter.actualLimit,
      filter.username,
      filter.email,
      filter.roleId,
      filter.isBanned,
      filter.isVerified,
    );
    const result = await this.queryBus.execute(getUsersQuery);
    return paginate(result.items, result.total, filter, (users) =>
      users.map((user) => UserResponseDto.fromAdminReadModel(user)),
    );
  }

  @ApiOperation({ summary: 'List' })
  @ApiBearerAuth()
  @Get()
  @ApiPaginatedResponse(UserResponseDto, 'offset')
  @CheckPolicy('manage', 'User')
  async findAll(@CurrentActor() actor: Actor, @Query() filter: FilterUserDto) {
    const getUsersQuery = new GetUsersQuery(
      actor,
      filter.actualPage,
      filter.actualLimit,
      filter.username,
      filter.email,
      filter.roleId,
      undefined,
      undefined,
    );
    const result = await this.queryBus.execute(getUsersQuery);
    return paginate(result.items, result.total, filter, (users) =>
      users.map((user) => UserResponseDto.fromAdminReadModel(user)),
    );
  }

  @ApiOperation({ summary: 'Toggle Ban' })
  @Patch(':id/ban')
  @ApiOkResponse({ type: UserResponseDto })
  @CheckPolicy('manage', 'User')
  async toggleBan(
    @CurrentActor() actor: Actor,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    const command = new ToggleBanCommand(actor, id);
    const user = await this.commandBus.execute(command);
    return new UserResponseDto(user);
  }

  @ApiOperation({ summary: 'Get User Profile Overview' })
  @Public()
  @Get(':id/overview')
  @CheckPolicy('read', 'PublicUser')
  @ApiOkResponse({ type: UserProfileOverviewResponseDto })
  async getUserProfileOverview(
    @CurrentActor() actor: Actor,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    const query = new GetUserProfileQuery(actor, id);
    const result = await this.queryBus.execute(query);
    return UserProfileOverviewResponseDto.fromReadModel(result);
  }

  @ApiOperation({ summary: 'Is User Exist' })
  @Public()
  @Get(':id/exist')
  @CheckPolicy('read', 'PublicUser')
  @ApiOkResponse({ schema: { type: 'boolean' } })
  async isUserExist(
    @CurrentActor() actor: Actor,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    const query = new CheckUserExistQuery(actor, id);
    const exists = await this.queryBus.execute(query);
    return exists;
  }

  @ApiOperation({ summary: 'Update My Profile Overview' })
  @Patch('me/overview')
  @ApiOkResponse({ type: UserResponseDto })
  @CheckPolicy('update', 'User')
  async updateMyProfileOverview(
    @CurrentActor() actor: Actor,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateUserOverviewDto,
  ) {
    const command = new UpdateUserCommand(
      actor,
      userId,
      dto.username,
      dto.bio,
      dto.location,
      dto.website,
    );
    const user = await this.commandBus.execute(command);
    return new UserResponseDto(user);
  }

  @ApiOperation({ summary: 'Update My Avatar' })
  @Patch('me/avatar')
  @CheckPolicy('update', 'User')
  @ApiOkResponse({ type: AvatarResponseDto })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async updateMyAvatar(
    @CurrentActor() actor: Actor,
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
    const command = new UpdateUserImageCommand(actor, userId, file);
    const result = await this.commandBus.execute(command);
    return AvatarResponseDto.fromResult(result);
  }

  @ApiOperation({ summary: 'Get My Reading Preferences' })
  @Get('me/reading-preferences')
  @CheckPolicy('read', 'User')
  @ApiOkResponse({ type: ReadingPreferencesResponseDto })
  async getMyReadingPreferences(
    @CurrentActor() actor: Actor,
    @CurrentUser('id') userId: string,
  ) {
    const query = new GetReadingPreferencesQuery(actor, userId);
    const preferences = await this.queryBus.execute(query);
    return ReadingPreferencesResponseDto.fromReadModel(preferences);
  }

  @ApiOperation({ summary: 'Update My Reading Preferences' })
  @Put('me/reading-preferences')
  @CheckPolicy('update', 'User')
  @ApiOkResponse({ type: ReadingPreferencesResponseDto })
  async updateMyReadingPreferences(
    @CurrentActor() actor: Actor,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateReadingPreferencesDto,
  ) {
    const command = new UpdateReadingPreferencesCommand(
      actor,
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

    const preferences = await this.commandBus.execute(command);
    return ReadingPreferencesResponseDto.fromResult(preferences);
  }

  @ApiOperation({ summary: 'Search Users' })
  @Public()
  @Get('search')
  @ApiPaginatedResponse(PublicUserResponseDto, 'offset')
  @CheckPolicy('read', 'PublicUser')
  async searchUsers(
    @CurrentActor() actor: Actor,
    @Query() filter: FilterUserDto,
  ) {
    const keyword = filter.username || filter.email || '';
    const query = new SearchUsersQuery(
      actor,
      keyword,
      filter.actualPage,
      filter.actualLimit,
    );
    const result =
      await this.queryBus.execute<PageResult<PublicUserReadModel>>(query);

    return paginate(result.items, result.total, filter, (users) =>
      users.map((user) => new PublicUserResponseDto(user)),
    );
  }
}
