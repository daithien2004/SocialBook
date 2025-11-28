import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import aqp from 'api-query-params';

import { User, UserDocument } from './schemas/user.schema';
import { Post, PostDocument } from '@/src/modules/posts/schemas/post.schema';
import {
  ReadingList,
  ReadingListDocument,
} from '@/src/modules/library/schemas/reading-list.schema';
import {
  Follow,
  FollowDocument,
} from '@/src/modules/follows/schemas/follow.schema';

import { CreateUserDto, UpdateRefreshTokenDto, UpdateUserOverviewDto } from './dto/user.dto';
import { CloudinaryService } from '@/src/modules/cloudinary/cloudinary.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Follow.name) private followModel: Model<FollowDocument>,
    @InjectModel(Post.name) private postModel: Model<PostDocument>,
    @InjectModel(ReadingList.name)
    private readingListModel: Model<ReadingListDocument>,
    private cloudinaryService: CloudinaryService,
  ) { }

  async isEmailExist(email: string) {
    const user = await this.userModel.exists({ email });
    return !!user;
  }

  async isUserExist(userId: string) {
    const user = await this.userModel.exists({ _id: userId });
    return !!user;
  }

  async create(createUserDto: CreateUserDto) {
    const { username, email, password, isVerified, provider, providerId, image, roleId } =
      createUserDto;

    const isExist = await this.isEmailExist(email);
    if (isExist) {
      throw new BadRequestException(`Email ${email} đã tồn tại.`);
    }

    const userData: any = {
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

    const newUser = await this.userModel.create(userData);
    return newUser;
  }

  async findAll(query: any, current: number, pageSize: number) {
    const { filter, sort } = aqp(query);

    delete filter.current;
    delete filter.pageSize;

    const page = Number(current) || 1;
    const limit = Number(pageSize) || 10;
    const skip = (page - 1) * limit;

    const [items, totalItems] = await Promise.all([
      this.userModel
        .find(filter)
        .sort((sort as any) || { createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('-password -hashedRt')
        .lean(),
      this.userModel.countDocuments(filter),
    ]);

    return {
      items,
      meta: {
        current: page,
        pageSize: limit,
        total: totalItems,
        totalPages: Math.ceil(totalItems / limit),
      },
    };
  }

  async findByEmail(email: string) {
    return this.userModel.findOne({ email });
  }

  async findById(id: string) {
    if (!Types.ObjectId.isValid(id))
      throw new BadRequestException('Invalid User ID');

    return this.userModel
      .findById(id)
      .populate('roleId')
      .select('-password')
      .lean()
  }

  async updateRefreshToken(userId: string, updateDto: UpdateRefreshTokenDto) {
    return this.userModel.findByIdAndUpdate(userId, updateDto, { new: true });
  }

  async checkRefreshTokenInDB(userId: string, rt: string) {
    const user = await this.userModel.findById(userId).select('+hashedRt'); // Explicit select
    if (!user || !user.hashedRt) return false;

    const isMatch = await bcrypt.compare(rt, user.hashedRt);
    return isMatch;
  }

  async toggleBan(userId: string) {
    if (!Types.ObjectId.isValid(userId))
      throw new BadRequestException('Invalid User ID');

    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    user.isBanned = !user.isBanned;
    await user.save();

    return user;
  }

  async getUserProfileOverview(userId: string) {
    if (!Types.ObjectId.isValid(userId))
      throw new BadRequestException('Invalid User ID');
    const objectId = new Types.ObjectId(userId);

    const user = await this.userModel
      .findById(objectId)
      .select('username image createdAt bio location website')
      .lean();

    if (!user) throw new NotFoundException('User not found');

    const [postCount, readingListCount, followersCount] = await Promise.all([
      this.postModel.countDocuments({ userId: objectId, isDelete: false }),
      this.readingListModel.countDocuments({ userId: objectId }),
      this.followModel.countDocuments({ targetId: objectId }),
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
      throw new BadRequestException('Invalid User ID');

    const objectId = new Types.ObjectId(userId);

    const user = await this.userModel.findById(objectId);
    if (!user) throw new NotFoundException('User not found');

    if (dto.username !== undefined && dto.username !== user.username) {
      const existed = await this.userModel.exists({
        username: dto.username,
        _id: { $ne: objectId },
      });
      if (existed) {
        throw new BadRequestException('Username is already taken');
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
      throw new BadRequestException('Image file is required');
    }
    if (!file.mimetype?.startsWith('image/')) {
      throw new BadRequestException('File must be an image');
    }
    if (file.size > 5 * 1024 * 1024) throw new BadRequestException('Image is too large (max 5MB)');

    const objectId = new Types.ObjectId(userId);

    const user = await this.userModel.findById(objectId);
    if (!user) throw new NotFoundException('User not found');

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

    const user = await this.userModel
      .findById(userId)
      .select('readingPreferences')
      .lean();

    if (!user) throw new NotFoundException('User not found');

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

  async updateReadingPreferences(userId: string, preferences: any) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid User ID');
    }

    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    // Merge with existing preferences
    user.readingPreferences = {
      ...user.readingPreferences,
      ...preferences,
    } as any;

    await user.save();

    return user.readingPreferences;
  }
}
