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
import mongoose from 'mongoose';

// Cấu hình toàn cục cho Mongoose để chuẩn hóa id
mongoose.set('toJSON', {
  virtuals: true,
  transform: (doc, ret: any) => {
    // Chỉ thêm id nếu chưa tồn tại
    if (!ret.id && ret._id) {
      ret.id = ret._id.toString();
      delete ret._id;
    }
    delete ret.__v; // Xóa trường __v
    return ret;
  },
});

mongoose.set('toObject', {
  virtuals: true,
  transform: (doc, ret: any) => {
    // Chỉ thêm id nếu chưa tồn tại
    if (!ret.id && ret._id) {
      ret.id = ret._id.toString();
      delete ret._id;
    }
    delete ret.__v; // Xóa trường __v
    return ret;
  },
});

// import seeders
import { BooksSeed } from './shared/database/seeds/books.seeder';
import { ChaptersSeed } from './shared/database/seeds/chapters.seeder';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from '@/src/common/guards/jwt-auth.guard';
import { OtpModule } from './modules/otp/otp.module';
import { MailerModule } from '@nestjs-modules/mailer';
import { RedisModule } from '@nestjs-modules/ioredis';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { PostsModule } from '@/src/modules/posts/posts.module';
import { CommentsModule } from '@/src/modules/comments/comments.module';
import { AuthorsModule } from './authors/authors.module';
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
      url: 'redis://localhost:6379', // Hoặc từ env variable
    }),
    ThrottlerModule.forRoot([
      {
        name: 'global', // đặt tên tuỳ ý
        ttl: 60, // 60 giây
        limit: 10, // 10 request trong 60s
      },
    ]),
    UsersModule,
    AuthModule,
    ChatModule,
    BooksModule,
    ChaptersModule,
    OtpModule,
    PostsModule,
	AuthorsModule,
    CommentsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    BooksSeed,
    ChaptersSeed,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
  // register seeders
  exports: [BooksSeed, ChaptersSeed],
})
export class AppModule {}
