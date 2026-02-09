import { Injectable, ConflictException, InternalServerErrorException, Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { IUserRepository } from '@/domain/users/repositories/user.repository.interface';
import { CreateUserUseCase } from '@/application/users/use-cases/create-user/create-user.use-case';
import { CreateUserCommand } from '@/application/users/use-cases/create-user/create-user.command';
import { GetRoleByNameUseCase } from '@/application/roles/use-cases/get-role-by-name.use-case';
import { GetRoleByNameQuery } from '@/application/roles/use-cases/get-role-by-name.query';
import { UserEmail } from '@/domain/users/value-objects/user-email.vo';
import { SendOtpUseCase } from '@/application/otp/use-cases/send-otp.use-case';
import { SendOtpCommand } from '@/application/otp/use-cases/send-otp.command';
import { RegisterCommand } from './register.command';

@Injectable()
export class RegisterUseCase {
  private readonly logger = new Logger(RegisterUseCase.name);

  constructor(
    private readonly userRepository: IUserRepository,
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly getRoleByNameUseCase: GetRoleByNameUseCase,
    private readonly sendOtpUseCase: SendOtpUseCase,
  ) { }

  async execute(command: RegisterCommand): Promise<string> {
    const emailVO = UserEmail.create(command.email);
    const user = await this.userRepository.findByEmail(emailVO);

    if (user) {
      if (!user.isVerified) {
        user.updateProfile({ username: command.username });
        if (command.password) {
          const hash = await bcrypt.hash(command.password, 10);
          user.updatePassword(hash);
        }
        await this.userRepository.save(user);

        return await this.sendOtp(command.email);
      }
      throw new ConflictException('Email này đã được sử dụng');
    }

    const roleQuery = new GetRoleByNameQuery('user');
    const userRole = await this.getRoleByNameUseCase.execute(roleQuery);
    if (!userRole) {
      this.logger.error('User role not found in database during signup - role may not be seeded');
      throw new InternalServerErrorException('Đã có lỗi xảy ra trong quá trình đăng ký');
    }

    const createUserCommand = new CreateUserCommand(
      command.username,
      command.email,
      command.password,
      userRole.id,
      undefined,
      'local'
    );
    await this.createUserUseCase.execute(createUserCommand);

    return await this.sendOtp(command.email);
  }

  private async sendOtp(email: string): Promise<string> {
    const sendOtpCommand = new SendOtpCommand(email);
    await this.sendOtpUseCase.execute(sendOtpCommand);
    return 'Mã OTP đã được gửi đến email của bạn';
  }
}
