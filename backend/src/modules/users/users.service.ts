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

import { CreateUserDto, UpdateRefreshTokenDto } from './dto/user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Follow.name) private followModel: Model<FollowDocument>,
    @InjectModel(Post.name) private postModel: Model<PostDocument>,
    @InjectModel(ReadingList.name)
    private readingListModel: Model<ReadingListDocument>,
  ) {}

  async isEmailExist(email: string) {
    const user = await this.userModel.exists({ email });
    return !!user;
  }

  async create(createUserDto: CreateUserDto) {
    const { username, email, password, provider, providerId, image, roleId } =
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
      .select('-password -hashedRt')
      .lean();
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
      .select('username image createdAt')
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
}
