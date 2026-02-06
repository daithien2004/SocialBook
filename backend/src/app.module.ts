import { JwtAuthGuard } from '@/src/common/guards/jwt-auth.guard';
import { AuthorsModule } from '@/src/modules/authors/authors.module';
import { CommentsModule } from '@/src/modules/comments/comments.module';
import { FollowsModule } from '@/src/modules/follows/follows.module';
import { LikesModule } from '@/src/modules/likes/likes.module';
import { NotificationsModule } from '@/src/modules/notifications/notifications.module';
import { PostsModule } from '@/src/modules/posts/posts.module';
import { ReviewsModule } from '@/src/modules/reviews/reviews.module';
import { CacheModule } from '@/src/shared/cache/redis.module';
import { LoggerModule } from '@/src/shared/logger/logger.module';
import { RedisModule } from '@nestjs-modules/ioredis';
import { MailerModule } from '@nestjs-modules/mailer';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { BooksModule } from './modules/books/books.module';
import { ChaptersModule } from './modules/chapters/chapters.module';
import { ChatModule } from './modules/chat/chat.module';
import { CloudinaryModule } from './modules/cloudinary/cloudinary.module';
import { ContentModerationModule } from './modules/content-moderation/content-moderation.module';
import { GamificationModule } from './modules/gamification/gamification.module';
import { GeminiModule } from './modules/gemini/gemini.module';
import { GenresModule } from './modules/genres/genres.module';
import { LibraryModule } from './modules/library/library.module';
import { OnboardingModule } from './modules/onboarding/onboarding.module';
import { OtpModule } from './modules/otp/otp.module';
import { RecommendationsModule } from './modules/recommendations/recommendations.module';
import { RolesModule } from './modules/roles/roles.module';
import { ScraperModule } from './modules/scraper/scraper.module';
import { SearchModule } from './modules/search/search.module';
import { StatisticsModule } from './modules/statistics/statistics.module';
import { TextToSpeechModule } from './modules/text-to-speech/text-to-speech.module';
import { UsersModule } from './modules/users/users.module';

import { envConfig } from './config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [envConfig],
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>(
          'env.MONGO_URI',
          'mongodb://localhost:27017/socialbook',
        ),
      }),
    }),
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        transport: {
          host: 'smtp.gmail.com',
          port: 587,
          secure: false,
          auth: {
            user: configService.get<string>('env.EMAIL_USER'),
            pass: configService.get<string>('env.EMAIL_PASS'),
          },
        },
        defaults: {
          from: `"No Reply" <${configService.get<string>('env.EMAIL_USER')}>`,
        },
      }),
    }),
    RedisModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const host = configService.get<string>('env.REDIS_HOST', 'localhost');
        const port = configService.get<number>('env.REDIS_PORT', 6379);
        const password = configService.get<string>('env.REDIS_PASSWORD');

        return {
          type: 'single',
          options: {
            host,
            port,
            password,
            tls: host !== 'localhost' ? { rejectUnauthorized: false } : undefined,
            lazyConnect: true,
            maxRetriesPerRequest: 3,
            retryStrategy: (times: number) => {
              if (times > 3) {
                console.warn('[Redis] Connection failed after 3 retries. Redis features will be disabled.');
                return null; // Stop retrying
              }
              return Math.min(times * 500, 2000); // Retry with delay
            },
          },
        };
      },
    }),
    ThrottlerModule.forRoot([
      {
        name: 'global',
        ttl: 60,
        limit: 10,
      },
    ]),
    CacheModule,
    LoggerModule,
    LibraryModule,
    RolesModule,
    ReviewsModule,
    TextToSpeechModule,
    LikesModule,
    UsersModule,
    AuthModule,
    ChatModule,
    BooksModule,
    ChaptersModule,
    OtpModule,
    PostsModule,
    AuthorsModule,
    GenresModule,
    CommentsModule,
    CloudinaryModule,
    LikesModule,
    FollowsModule,
    StatisticsModule,
    GeminiModule,
    ContentModerationModule,
    RecommendationsModule,
    ScraperModule,
    NotificationsModule,
    SearchModule,
    OnboardingModule,
    GamificationModule,
    LibraryModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule { }
