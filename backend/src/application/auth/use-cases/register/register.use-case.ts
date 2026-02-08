
import { Injectable, ConflictException, InternalServerErrorException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { IUserRepository } from '@/domain/users/repositories/user.repository.interface';
import { CreateUserUseCase } from '@/application/users/use-cases/create-user/create-user.use-case';
import { CreateUserCommand } from '@/application/users/use-cases/create-user/create-user.command';
import { GetRoleByNameUseCase } from '@/application/roles/use-cases/get-role-by-name.use-case';
import { UserEmail } from '@/domain/users/value-objects/user-email.vo';
import { SendOtpUseCase } from '@/application/otp/use-cases/send-otp.use-case';
import { SignupLocalDto } from '../../dto/auth.dto';
import { Logger } from '@/shared/logger';

@Injectable()
export class RegisterUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly getRoleByNameUseCase: GetRoleByNameUseCase,
    private readonly sendOtpUseCase: SendOtpUseCase,
    private readonly logger: Logger,
  ) {
    this.logger.setContext(RegisterUseCase.name);
  }

  async execute(dto: SignupLocalDto): Promise<string> {
    const emailVO = UserEmail.create(dto.email);
    const user = await this.userRepository.findByEmail(emailVO);
    
    if (user) {
      if (!user.isVerified) {
        user.updateProfile({ username: dto.username });
        if (dto.password) {
             const hash = await bcrypt.hash(dto.password, 10);
             user.updatePassword(hash);
        }
        await this.userRepository.save(user);

        return await this.sendOtp(dto.email);
      }
      throw new ConflictException('Email này đã được sử dụng');
    }

    const userRole = await this.getRoleByNameUseCase.execute('user');
    if (!userRole) {
      this.logger.error('User role not found in database during signup - role may not be seeded');
      throw new InternalServerErrorException('Đã có lỗi xảy ra trong quá trình đăng ký');
    }

    const command = new CreateUserCommand(
        dto.username,
        dto.email,
        dto.password,
        userRole.id,
        undefined,
        'local'
    );
    await this.createUserUseCase.execute(command);

    return await this.sendOtp(dto.email);
  }

  private async sendOtp(email: string): Promise<string> {
    await this.sendOtpUseCase.execute(email);
    return 'Mã OTP đã được gửi đến email của bạn';
  }
}
