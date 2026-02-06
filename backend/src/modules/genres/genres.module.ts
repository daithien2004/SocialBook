import { DataAccessModule } from '@/src/data-access/data-access.module';
import { Module } from '@nestjs/common';
import { GenresController } from './genres.controller';
import { GenresService } from './genres.service';

@Module({
    imports: [
        DataAccessModule,
    ],
    controllers: [GenresController],
    providers: [GenresService],
    exports: [GenresService],
})
export class GenresModule { }