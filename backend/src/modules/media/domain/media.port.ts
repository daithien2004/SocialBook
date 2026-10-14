export interface MediaUploadFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
}

export abstract class IMediaPort {
  abstract uploadImage(file: MediaUploadFile): Promise<string>;
  abstract uploadMultipleImages(files: MediaUploadFile[]): Promise<string[]>;
  abstract deleteImage(publicId: string): Promise<void>;
  abstract deleteMultipleImages(publicIds: string[]): Promise<void>;
  abstract uploadAudio(file: MediaUploadFile): Promise<string>;
}
