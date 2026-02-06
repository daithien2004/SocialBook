import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import aqp from 'api-query-params';
import * as bcrypt from 'bcrypt';
import { Types } from 'mongoose';

import { ReadingListRepository } from '@/src/modules/library/reading-list.repository';
import { FollowsRepository } from '../../data-access/repositories/follows.repository';
import { PostsRepository } from '../../data-access/repositories/posts.repository';
import { UsersRepository } from '../../data-access/repositories/users.repository';
import { User, UserDocument } from './schemas/user.schema';

import { ErrorMessages } from '@/src/common/constants/error-messages';
import { CloudinaryService } from '@/src/modules/cloudinary/cloudinary.service';
import { UpdateReadingPreferencesDto } from './dto/update-reading-preferences.dto';
import { CreateUserDto, UpdateRefreshTokenDto, UpdateUserOverviewDto } from './dto/user.dto';
import { UserModal } from './modals/user.modal';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly followsRepository: FollowsRepository,
    private readonly postsRepository: PostsRepository,
    private readonly readingListRepository: ReadingListRepository,
    private cloudinaryService: CloudinaryService,
  ) { }

  async isEmailExist(email: string) {
    return this.usersRepository.existsByEmail(email);
  }

  async isUserExist(userId: string) {
    return this.usersRepository.existsById(userId);
  }

  async create(createUserDto: CreateUserDto) {
    const { username, email, password, isVerified, provider, providerId, image, roleId } =
      createUserDto;

    const isExist = await this.isEmailExist(email);
    if (isExist) {
      throw new BadRequestException(ErrorMessages.EMAIL_EXISTS);
    }

    const userData: Partial<User> = {
      username,
      email,
      provider,
      providerId,
      image,
      isVerified,
      roleId,
    };

    if (password) {
      const hashPassword = await bcrypt.hash(password, 10);
      userData.password = hashPassword;
    }

    const newUser = await this.usersRepository.create(userData as Partial<UserDocument>);
    return new UserModal(newUser);
  }

  async updateUnverifiedUser(userId: string, dto: { username: string; password?: string }) {
    const updateData: Partial<User> = { username: dto.username };
    if (dto.password) {
      updateData.password = await bcrypt.hash(dto.password, 10);
    }
    return this.usersRepository.update(userId, updateData);
  }

  async findAll(query: Record<string, unknown>, current: number, pageSize: number) {
    const { filter, sort } = aqp(query as any);

    delete filter.current;
    delete filter.pageSize;

    const page = Number(current) || 1;
    const limit = Number(pageSize) || 10;
    const skip = (page - 1) * limit;

    const [items, totalItems] = await Promise.all([
      this.usersRepository.findAllWithSelect(
        filter,
        (sort as any) || { createdAt: -1 },
        skip,
        limit,
        '-password -hashedRt'
      ),
      this.usersRepository.count(filter),
    ]);

    return {
      data: items,
      meta: {
        current: page,
        pageSize: limit,
        total: totalItems,
        totalPages: Math.ceil(totalItems / limit),
      },
    };
  }

  async findByEmail(email: string) {
    return this.usersRepository.findOne({ email });
  }

  async findById(id: string) {
    if (!Types.ObjectId.isValid(id))
      throw new BadRequestException(ErrorMessages.INVALID_ID);

    const user = await this.usersRepository.findByIdWithRole(id);
    return user ? new UserModal(user) : null;
  }

  async updateRefreshToken(userId: string, updateDto: UpdateRefreshTokenDto) {
    return this.usersRepository.update(userId, updateDto);
  }

  async findForRefreshToken(userId: string) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException(ErrorMessages.INVALID_ID);
    }
    return this.usersRepository.findForRefreshToken(userId);
  }

  async checkRefreshTokenInDB(userId: string, rt: string) {
    const user = await this.usersRepository.findForRefreshToken(userId); // Explicit select
    if (!user || !user.hashedRt) return false;

    const isMatch = await bcrypt.compare(rt, user.hashedRt);
    return isMatch;
  }

  async toggleBan(userId: string) {
    if (!Types.ObjectId.isValid(userId))
      throw new BadRequestException(ErrorMessages.INVALID_ID);

    const user = await this.usersRepository.findById(userId);
    if (!user) throw new NotFoundException(ErrorMessages.USER_NOT_FOUND);

    user.isBanned = !user.isBanned;
    await user.save();

    return new UserModal(user);
  }

  async getUserProfileOverview(userId: string) {
    if (!Types.ObjectId.isValid(userId))
      throw new BadRequestException(ErrorMessages.INVALID_ID);
    const objectId = new Types.ObjectId(userId);

    const user = await this.usersRepository.findProfile(objectId);

    if (!user) throw new NotFoundException(ErrorMessages.USER_NOT_FOUND);

    const [postCount, readingListCount, followersCount] = await Promise.all([
      this.postsRepository.countByUser(objectId),
      this.readingListRepository.countByUser(objectId),
      this.followsRepository.countFollowers(objectId),
    ]);

    return {
      ...user,
      postCount,
      readingListCount,
      followersCount,
    };
  }

  async updateUserProfileOverview(
    userId: string,
    dto: UpdateUserOverviewDto,
  ) {
    if (!Types.ObjectId.isValid(userId))
      throw new BadRequestException(ErrorMessages.INVALID_ID);

    const objectId = new Types.ObjectId(userId);

    const user = await this.usersRepository.findById(userId);
    if (!user) throw new NotFoundException(ErrorMessages.USER_NOT_FOUND);

    if (dto.username !== undefined && dto.username !== user.username) {
      const existed = await this.usersRepository.existsByUsername(dto.username, objectId);
      if (existed) {
        throw new BadRequestException(ErrorMessages.USERNAME_TAKEN);
      }
      user.username = dto.username;
    }

    user.bio = dto.bio ?? user.bio;
    user.website = dto.website ?? user.website;
    user.location = dto.location ?? user.location;

    await user.save();

    return {
      data: {
        username: user.username,
        image: user.image,
        bio: user.bio,
        location: user.location,
        website: user.website,
        updatedAt: user.updatedAt,
      },
    };
  }

  async updateUserImage(userId: string, file: Express.Multer.File) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid User ID');
    }
    if (!file || !file.buffer) {
      throw new BadRequestException(ErrorMessages.IMAGE_REQUIRED);
    }
    if (!file.mimetype?.startsWith('image/')) {
      throw new BadRequestException(ErrorMessages.FILE_NOT_IMAGE);
    }
    if (file.size > 5 * 1024 * 1024) throw new BadRequestException(ErrorMessages.IMAGE_TOO_LARGE);

    const objectId = new Types.ObjectId(userId);

    const user = await this.usersRepository.findById(userId);
    if (!user) throw new NotFoundException(ErrorMessages.USER_NOT_FOUND);

    const secureUrl = await this.cloudinaryService.uploadImage(file);

    user.image = secureUrl;
    await user.save();

    return {
      message: 'Avatar updated successfully.',
    };
  }

  // Reading Preferences Methods
  async getReadingPreferences(userId: string) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid User ID');
    }

    const user = await this.usersRepository.findReadingPreferences(userId);

    if (!user) throw new NotFoundException(ErrorMessages.USER_NOT_FOUND);

    // Return default preferences if not set
    return (
      user.readingPreferences || {
        theme: 'dark',
        fontSize: 18,
        fontFamily: 'Georgia, serif',
        lineHeight: 1.8,
        letterSpacing: 0.5,
        backgroundColor: '#1a1a1a',
        textColor: '#e5e5e5',
        textAlign: 'justify',
        marginWidth: 0,
      }
    );
  }

  async updateReadingPreferences(userId: string, preferences: UpdateReadingPreferencesDto) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid User ID');
    }

    const user = await this.usersRepository.findById(userId);
    if (!user) throw new NotFoundException(ErrorMessages.USER_NOT_FOUND);

    // Merge with existing preferences
    user.readingPreferences = {
      ...user.readingPreferences,
      ...preferences,
    } as any; // Cast in implementation is sometimes unavoidable with Mongoose complex types

    await user.save();

    return user.readingPreferences;
  }

  async searchUsersByUsername(
    keyword: string,
    current = 1,
    pageSize = 10,
  ) {
    if (!keyword || !keyword.trim()) {
      throw new BadRequestException(ErrorMessages.SEARCH_REQUIRED);
    }

    const page = Number(current) || 1;
    const limit = Number(pageSize) || 10;
    const skip = (page - 1) * limit;

    const filter = {
      username: {
        $regex: keyword,
        $options: 'i', // không phân biệt hoa thường
      },
      isBanned: false,
    };

    const [items, totalItems] = await Promise.all([
      this.usersRepository.getSearchUsers(filter, skip, limit),
      this.usersRepository.count(filter),
    ]);

    return {
      data: items,
      meta: {
        current: page,
        pageSize: limit,
        total: totalItems,
        totalPages: Math.ceil(totalItems / limit),
      },
    };
  }

}
