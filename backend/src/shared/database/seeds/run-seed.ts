import { NestFactory } from '@nestjs/core';
import { DatabaseSeedModule } from './database.seed.module';
import { SeederService } from './seeder.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(DatabaseSeedModule);
  
  const seeder = app.get(SeederService);
  
  try {
    // Xóa dữ liệu cũ trước khi seed (tùy chọn)
    await seeder.clear();
    
    // Chạy seeding
    await seeder.seed();
    
    console.log('🎉 Database seeding completed!');
    process.exit(0);
  } catch (error) {
    console.error('💥 Seeding failed:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

bootstrap();