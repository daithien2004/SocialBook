import cloudinary from './cloudinary.provider';
import { UploadApiResponse } from 'cloudinary';
import { PassThrough } from 'stream';

export function uploadBufferToCloudinary(
  buffer: Buffer,
  options: Record<string, any>,
): Promise<UploadApiResponse> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      options,
      (error, result) => {
        if (error) return reject(error);
        if (!result) return reject(new Error('Upload failed: no result returned'));
        resolve(result);
      },
    );

    const stream = new PassThrough();
    stream.end(buffer);
    stream.pipe(uploadStream);
  });
}
