
import { Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { IUserRepository } from '@/src/modules/users/domain/repositories/user.repository.interface';
import { UserEmail } from '@/src/modules/users/domain/value-objects/user-email.vo';

@Injectable()
export class ValidateUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(email: string, pass: string): Promise<any> {
    const emailVO = UserEmail.create(email);
    const user = await this.userRepository.findByEmail(emailVO);
    
    if (!user) {
      return null;
    }

    const isMatch = await bcrypt.compare(pass, user.password || '');
    if (!isMatch) {
      return null;
    }

    if (user.isBanned) {
      throw new ForbiddenException({
        statusCode: 403,
        message: 'Tài khoản của bạn đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên.',
        error: 'USER_BANNED',
      });
    }

    // Return specific user info needed by LocalStrategy/Login
    /* 
       Note: The original service returned the whole user entity. 
       LocalStrategy used it to populate req.user for Login controller.
    */
    const { password, ...result } = user; // strip password although Mongoose document might behave differently
    return user;
  }
}
