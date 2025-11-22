import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto, UpdateRefreshTokenDto } from './dto/user.dto';
import * as bcrypt from 'bcrypt';
import aqp from 'api-query-params';
@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) { }

  async isEmailExist(email: string) {
    const user = await this.userModel.exists({ email });
    return !!user;
  }

  async create(createUserDto: CreateUserDto): Promise<UserDocument> {
    const { username, email, password, provider, providerId, image, roleId } =
      createUserDto;

    const isExist = await this.isEmailExist(email);
    if (isExist) {
      throw new BadRequestException(
        `Email đã tồn tại: ${email}. Vui lòng sử dụng email khác.`,
      );
    }

    if (!password) {
      return this.userModel.create({
        username,
        email,
        provider,
        providerId,
        image,
        roleId,
      });
    }

    const hashPassword = await bcrypt.hash(password!, 10);
    return this.userModel.create({
      username,
      email,
      password: hashPassword,
      provider,
      roleId,
    });
  }

  async findAll(query: string, current: number, pageSize: number) {
    const { filter, sort } = aqp(query);

    delete (filter as any).current;
    delete (filter as any).pageSize;

    current = Number(current) || 1;
    pageSize = Number(pageSize) || 10;
    if (current < 1) current = 1;
    if (pageSize < 1) pageSize = 1;
    if (pageSize > 100) pageSize = 100;

    const totalItems = await this.userModel.countDocuments(filter).exec();
    const totalPages = Math.max(Math.ceil(totalItems / pageSize), 1);
    const offset = (current - 1) * pageSize;

    const items = await this.userModel
      .find(filter)
      .sort((sort as any) ?? {})
      .skip(offset)
      .limit(pageSize)
      .select('-password -hashedRt')
      .lean()
      .exec();

    return {
      items,
      pagination: {
        current,
        pageSize,
        totalItems,
        totalPages,
      },
    };
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).populate('roleId').exec();
  }

  async updateRefreshToken(
    userId: string,
    updateDto: UpdateRefreshTokenDto,
  ): Promise<UserDocument | null> {
    return this.userModel.findByIdAndUpdate(userId, updateDto, { new: true });
  }

  async checkRefreshTokenInDB(userId: string, rt: string) {
    const user = await this.userModel.findById(userId).exec();
    if (!user || !user.hashedRt) return false;
    const isMatch = await bcrypt.compare(rt, user.hashedRt);
    return isMatch;
  }
}
