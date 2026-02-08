export abstract class IMediaService {
  abstract uploadImage(file: Express.Multer.File): Promise<string>;
  abstract uploadMultipleImages(files: Express.Multer.File[]): Promise<string[]>;
  abstract deleteImage(publicId: string): Promise<void>;
  abstract deleteMultipleImages(publicIds: string[]): Promise<void>;
  abstract uploadAudio(file: Express.Multer.File): Promise<string>;
}
