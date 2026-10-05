import { RegisterCommand } from './register.command';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  Injectable,
  ConflictException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { IPasswordHasher } from '@/shared/domain/password-hasher.interface';
import { IUserRepository } from '@/domain/users/repositories/user.repository.interface';
import { CreateUserHandler } from '@/application/users/commands/create-user/create-user.handler';
import { CreateUserCommand } from '@/application/users/commands/create-user/create-user.command';
import { GetRoleByNameHandler } from '@/application/roles/queries/get-role-by-name/get-role-by-name.handler';
import { GetRoleByNameQuery } from '@/application/roles/queries/get-role-by-name/get-role-by-name.query';
import { UserEmail } from '@/domain/users/value-objects/user-email.vo';
import { SendOtpHandler } from '@/application/otp/commands/send-otp/send-otp.handler';
import { SendOtpCommand } from '@/application/otp/commands/send-otp/send-otp.command';

@CommandHandler(RegisterCommand)
export class RegisterHandler {
  private readonly logger = new Logger(RegisterHandler.name);

  constructor(
    private readonly userRepository: IUserRepository,
    private readonly createUserUseCase: CreateUserHandler,
    private readonly getRoleByNameUseCase: GetRoleByNameHandler,
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

    const roleQuery = new GetRoleByNameQuery('user');
    const userRole = await this.getRoleByNameUseCase.execute(roleQuery);
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
    await this.createUserUseCase.execute(createUserCommand);

    return await this.sendOtp(command.email);
  }

  private async sendOtp(email: string): Promise<string> {
    const sendOtpCommand = new SendOtpCommand(email);
    await this.sendOtpUseCase.execute(sendOtpCommand);
    return 'Mã OTP đã được gửi đến email của bạn';
  }
}
