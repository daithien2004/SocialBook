import { registerAs } from '@nestjs/config';

export default registerAs('env', () => ({
    // Server
    PORT: parseInt(process.env.PORT ?? '', 10) || 5000,
    NODE_ENV: process.env.NODE_ENV || 'development',

    // Database
    MONGO_URI:
        process.env.MONGO_URI || 'mongodb://localhost:27017/socialbook',

    // Redis
    REDIS_HOST: process.env.REDIS_HOST || 'localhost',
    REDIS_PORT: parseInt(process.env.REDIS_PORT ?? '', 10) || 6379,
    REDIS_PASSWORD: process.env.REDIS_PASSWORD || '',

    // JWT
    JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'access-secret',
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'refresh-secret',
    JWT_ACCESS_EXPIRES: process.env.JWT_ACCESS_EXPIRES || '15m',
    JWT_REFRESH_EXPIRES: process.env.JWT_REFRESH_EXPIRES || '7d',

    // Email
    EMAIL_USER: process.env.EMAIL_USER || '',
    EMAIL_PASS: process.env.EMAIL_PASS || '',

    // Cloudinary
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || '',
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || '',
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || '',

    // External APIs
    GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
    GOOGLE_API_KEY: process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || '', // Fallback or alias
    VOICERSS_API_KEY: process.env.VOICERSS_API_KEY || '',

    // Cache
    CACHE_TTL: parseInt(process.env.CACHE_TTL ?? '', 10) || 900,
}));
