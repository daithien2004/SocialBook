import {
  BadRequestException,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { LoginDto } from '../dto/auth.dto';

@Injectable()
export class LoginGuard extends AuthGuard('local') {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{ body: unknown }>();
    const dto = plainToInstance(LoginDto, request.body ?? {});

    const errors = await validate(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    if (errors.length > 0) {
      const messages = errors.flatMap((error) =>
        Object.values(error.constraints ?? {}),
      );
      throw new BadRequestException(
        messages.length > 0 ? messages : 'Dữ liệu đăng nhập không hợp lệ',
      );
    }

    return super.canActivate(context) as Promise<boolean>;
  }
}
