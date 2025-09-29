import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../users/schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateRefreshTokenDto } from './dto/update-refresh-token.dto';
import * as argon2 from 'argon2';
import aqp from 'api-query-params'
@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  isEmailExist = async (email: string) => {
    const user = await this.userModel.exists({ email: email });
    return !!user;
  };

  async create(createUserDto: CreateUserDto): Promise<UserDocument> {
    const { email, password } = createUserDto;

    const isExist = await this.isEmailExist(email);
    if (isExist) {
      throw new BadRequestException(
        `Email đã tồn tại" ${email}. Vui lòng sử dụng email khác.`,
      );
    }

    const hashPassword = await argon2.hash(password);
    return this.userModel.create({
      email,
      password: hashPassword,
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
      .select("-password")
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
    return this.userModel.findById(id).exec();
  }

  async updateRefreshToken(
    userId: string,
    updateDto: UpdateRefreshTokenDto,
  ): Promise<UserDocument | null> {
    return this.userModel.findByIdAndUpdate(userId, updateDto, { new: true });
  }
}
