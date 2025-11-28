import { Module } from '@nestjs/common';
import { GeminiService } from './gemini.service';
import { GeminiController } from './gemini.controller';
import { ConfigModule } from '@nestjs/config';
import { ChaptersModule } from '../chapters/chapters.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ChaptersModule,
  ],
  controllers: [GeminiController],
  providers: [GeminiService],
})
export class GeminiModule {}
