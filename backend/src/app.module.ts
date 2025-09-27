import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { BooksModule } from './modules/books/books.module';
import { ChaptersModule } from './modules/chapters/chapters.module';
import { ChatModule } from './chat/chat.module';


// import seeders
import { BooksSeed } from './seeds/books.seeder';
import { ChaptersSeed } from './seeds/chapters.seeder';
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
    UsersModule,
    AuthModule,
    ChatModule,
    ChatModule,    BooksModule,
    ChaptersModule,
  ],
  controllers: [AppController],
  providers: [AppService, BooksSeed, ChaptersSeed],
  // register seeders
  exports: [BooksSeed, ChaptersSeed],
})
export class AppModule { }
