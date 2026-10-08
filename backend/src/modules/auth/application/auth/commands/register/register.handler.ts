import { RegisterCommand } from './register.command';
import { CommandHandler } from '@nestjs/cqrs';
import {
  ConflictException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { IPasswordHasher } from '@/shared/domain/password-hasher.interface';
import { IUserRepository } from '@/modules/users/domain/public-api';
import { IRoleRepository } from '@/modules/roles/domain/public-api';
import { UserCreationPort } from '@/modules/users/application/public-api';
import { CreateUserCommand } from '@/modules/users/application/public-api';
import { UserEmail } from '@/modules/users/domain/public-api';
import { SendOtpHandler } from '@/modules/auth/application/otp/commands/send-otp/send-otp.handler';
import { SendOtpCommand } from '@/modules/auth/application/otp/commands/send-otp/send-otp.command';

@CommandHandler(RegisterCommand)
export class RegisterHandler {
  private readonly logger = new Logger(RegisterHandler.name);

  constructor(
    private readonly userRepository: IUserRepository,
    private readonly roleRepository: IRoleRepository,
    private readonly createUserService: UserCreationPort,
    private readonly sendOtpUseCase: SendOtpHandler,
    private readonly passwordHasher: IPasswordHasher,
  ) {}

  async execute(command: RegisterCommand): Promise<string> {
    const emailVO = UserEmail.create(command.email);
    const user = await this.userRepository.findByEmail(emailVO);

    if (user) {
      if (!user.isVerified) {
        user.updateProfile({ username: command.username });
        if (command.password) {
          const hash = await this.passwordHasher.hash(command.password);
          user.updatePassword(hash);
        }
        await this.userRepository.save(user);

        return await this.sendOtp(command.email);
      }
      throw new ConflictException('Email này đã được sử dụng');
    }

    const userRole = await this.roleRepository.findByName('user');
    if (!userRole) {
      this.logger.error(
        'User role not found in database during signup - role may not be seeded',
      );
      throw new InternalServerErrorException(
        'Đã có lỗi xảy ra trong quá trình đăng ký',
      );
    }

    const createUserCommand = new CreateUserCommand(
      command.username,
      command.email,
      command.password,
      userRole.id,
      undefined,
      'local',
    );
    await this.createUserService.create(createUserCommand);

    return await this.sendOtp(command.email);
  }

  private async sendOtp(email: string): Promise<string> {
    const sendOtpCommand = new SendOtpCommand(email);
    await this.sendOtpUseCase.execute(sendOtpCommand);
    return 'Mã OTP đã được gửi đến email của bạn';
  }
}
