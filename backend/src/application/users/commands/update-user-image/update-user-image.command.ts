import { Command } from '@nestjs/cqrs';
import { NotFoundDomainException, BadRequestDomainException } from "@/shared/domain/common-exceptions";
import { IUserRepository } from "@/domain/users/repositories/user.repository.interface";
import { UserId } from "@/domain/users/value-objects/user-id.vo";
import { IMediaPort } from "@/domain/cloudinary/interfaces/media.port";

export class UpdateUserImageCommand extends Command<{ url: string }> {
  constructor(
    public readonly userId: string,
    public readonly file: Express.Multer.File,
  ) {
    super();
  }
}
