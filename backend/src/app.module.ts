import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { BooksModule } from './modules/books/books.module';
import { ChaptersModule } from './modules/chapters/chapters.module';
import { ChatModule } from './modules/chat/chat.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from '@/src/common/guards/jwt-auth.guard';
import { OtpModule } from './modules/otp/otp.module';
import { MailerModule } from '@nestjs-modules/mailer';
import { RedisModule } from '@nestjs-modules/ioredis';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { PostsModule } from '@/src/modules/posts/posts.module';
import { CommentsModule } from '@/src/modules/comments/comments.module';
import { AuthorsModule } from '@/src/modules/authors/authors.module';
import { RolesModule } from './modules/roles/roles.module';
import { ReviewsModule } from '@/src/modules/reviews/reviews.module';
import { TextToSpeechModule } from './modules/text-to-speech/text-to-speech.module';
import { LikesModule } from '@/src/modules/likes/likes.module';
import { CloudinaryModule } from './modules/cloudinary/cloudinary.module';
import { GenresModule } from './modules/genres/genres.module';
import { FollowsModule } from '@/src/modules/folllows/folllows.module';
import { LibraryModule } from './modules/library/library.module';
import { StatisticsModule } from './modules/statistics/statistics.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>(
          'MONGO_URI',
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
            user: configService.get<string>('EMAIL_USER'),
            pass: configService.get<string>('EMAIL_PASS'),
          },
        },
        defaults: {
          from: `"No Reply" <${configService.get<string>('EMAIL_USER')}>`,
        },
      }),
    }),
    RedisModule.forRoot({
      type: 'single',
      url: 'redis://localhost:6379',
    }),
    ThrottlerModule.forRoot([
      {
        name: 'global',
        ttl: 60,
        limit: 10,
      },
    ]),
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
