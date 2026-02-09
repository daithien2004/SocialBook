import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { IUserRepository } from '@/domain/users/repositories/user.repository.interface';
import { UserId } from '@/domain/users/value-objects/user-id.vo';
import { IMediaService } from '@/domain/cloudinary/interfaces/media.service.interface';
import { UpdateUserImageCommand } from './update-user-image.command';

@Injectable()
export class UpdateUserImageUseCase {
    constructor(
        private readonly userRepository: IUserRepository,
        private readonly mediaService: IMediaService
    ) { }

    async execute(command: UpdateUserImageCommand, file: Express.Multer.File): Promise<{ url: string }> {
        if (!file) {
            throw new BadRequestException('File is required');
        }

        const userId = UserId.create(command.userId);
        const user = await this.userRepository.findById(userId);

        if (!user) {
            throw new NotFoundException('User not found');
        }

        const url = await this.mediaService.uploadImage(file);

        user.updateProfile({ image: url });
        await this.userRepository.save(user);

        return { url };
    }
}
