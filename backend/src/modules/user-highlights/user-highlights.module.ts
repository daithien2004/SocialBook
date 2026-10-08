import { Module } from '@nestjs/common';
import { UserHighlightsApplicationModule } from './application/user-highlights-application.module';
import { UserHighlightsController } from './presentation/user-highlights.controller';

@Module({
  imports: [UserHighlightsApplicationModule],
  controllers: [UserHighlightsController],
})
export class UserHighlightsModule {}
