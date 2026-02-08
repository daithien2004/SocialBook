import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';
import { IMediaService } from '@/domain/cloudinary/interfaces/media.service.interface';

@Injectable()
export class CloudinaryService implements IMediaService {
  async uploadImage(file: Express.Multer.File): Promise<string> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'posts',
          resource_type: 'auto',
        },
        (error, result) => {
          if (error) return reject(error);
          if (!result)
            return reject(new Error('Upload failed: result is undefined'));

          resolve(result.secure_url);
        },
      );

      const stream = Readable.from(file.buffer);
      stream.pipe(uploadStream);
    });
  }

  async uploadMultipleImages(files: Express.Multer.File[]): Promise<string[]> {
    const uploadPromises = files.map((file) => this.uploadImage(file));
    return Promise.all(uploadPromises);
  }

  async deleteImage(publicId: string): Promise<void> {
    try {
        await cloudinary.uploader.destroy(publicId);
    } catch (error) {
        // Log error but generally we might not want to throw if deletion fails on cloud
        console.error('Failed to delete image from Cloudinary', error);
    }
  }

  async deleteMultipleImages(publicIds: string[]): Promise<void> {
    const deletePromises = publicIds.map((id) => this.deleteImage(id));
    await Promise.all(deletePromises);
  }

  async uploadAudio(file: Express.Multer.File): Promise<string> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'tts', // hoặc 'socialbook/audios'
          resource_type: 'video', // Cloudinary dùng 'video' cho audio
          format: 'mp3',
        },
        (error, result) => {
          if (error) return reject(error);
          if (!result)
            return reject(new Error('Upload failed: result is undefined'));

          resolve(result.secure_url);
        },
      );

      const stream = Readable.from(file.buffer);
      stream.pipe(uploadStream);
    });
  }
}

